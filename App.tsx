import React, { useState, useCallback } from 'react';
import { processExcelFile } from './services/excelProcessor';
import { analyzeAcknowledgements, describeImage } from './services/geminiService';
import { processContactSheet } from './services/contactSheetProcessor';
import { FileUpload } from './components/FileUpload';
import { ResultsTable } from './components/ResultsTable';
import { ErrorIcon } from './components/icons/ErrorIcon';
import { ActionsHeader } from './components/ActionsHeader';
import { DropdownMenu } from './components/DropdownMenu';
import { InfoPanel } from './components/InfoPanel';
import type { AcknowledgementRecord, AppStatus, AIFlaggedRecord, ContactSheetStatus, ImageAnalysisResult, ExtractedImage, AIAnalysisStatus } from './types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import saveAs from "file-saver";


const cleanAcknowledgement = (ack: string, source: string): string => {
  const cleanedAck = ack.trim();
  const cleanedSource = source.trim();

  if (!cleanedSource) return cleanedAck;

  const escapedSource = cleanedSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexEnd = new RegExp(`\\s*\\/\\s*${escapedSource}$`, 'i');
  const regexStart = new RegExp(`^${escapedSource}\\s*\\/\\s*`, 'i');

  let result = cleanedAck;
  if (regexEnd.test(result)) {
    result = result.replace(regexEnd, '');
  } else if (regexStart.test(result)) {
    result = result.replace(regexStart, '');
  }
  return result.trim();
};

const isCoverPage = (pageNumber: string): boolean => {
  const normalizedPageNumber = pageNumber.trim().toLowerCase();

  if (normalizedPageNumber === '') {
    return true;
  }

  const exactMatchKeywords = ['c'];
  if (exactMatchKeywords.includes(normalizedPageNumber)) {
    return true;
  }
  
  const partialMatchKeywords = [
    'cov',
    'cover',
    'cvr',
    'fc', // Front Cover
    'bc', // Back Cover
    'ifc', // Inside Front Cover
    'ibc', // Inside Back Cover
  ];

  return partialMatchKeywords.some(keyword => normalizedPageNumber.includes(keyword));
};


const processGroup = (records: AcknowledgementRecord[]): { uniqueRecords: AcknowledgementRecord[], duplicates: AcknowledgementRecord[] } => {
  const cleanedRecords = records.map(record => ({
    ...record,
    acknowledgement: cleanAcknowledgement(record.acknowledgement, record.source),
  }));

  const groupedBySource = new Map<string, AcknowledgementRecord[]>();
  cleanedRecords.forEach(record => {
    if (!groupedBySource.has(record.source)) {
      groupedBySource.set(record.source, []);
    }
    groupedBySource.get(record.source)?.push(record);
  });
  
  const sortedSources = Array.from(groupedBySource.keys()).sort((a, b) => a.localeCompare(b));
  
  const uniqueRecords: AcknowledgementRecord[] = [];
  const duplicates: AcknowledgementRecord[] = [];
  
  sortedSources.forEach(source => {
    const sourceRecords = groupedBySource.get(source) || [];
    sourceRecords.sort((a, b) => a.acknowledgement.localeCompare(b.acknowledgement));
    
    const seenAcks = new Set<string>();
    sourceRecords.forEach(record => {
      if (seenAcks.has(record.acknowledgement)) {
        duplicates.push(record);
      } else {
        seenAcks.add(record.acknowledgement);
        uniqueRecords.push(record);
      }
    });
  });

  return { uniqueRecords, duplicates };
};


const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isbn, setIsbn] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);
  const [originalRecords, setOriginalRecords] = useState<AcknowledgementRecord[]>([]);
  
  const [coverData, setCoverData] = useState<AcknowledgementRecord[]>([]);
  const [nonCoverData, setNonCoverData] = useState<AcknowledgementRecord[]>([]);
  const [removedDuplicates, setRemovedDuplicates] = useState<AcknowledgementRecord[]>([]);
  const [crossCategoryDuplicates, setCrossCategoryDuplicates] = useState<AcknowledgementRecord[]>([]);
  
  // State for AI Analysis
  const [aiFlags, setAiFlags] = useState<AIFlaggedRecord[]>([]);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<AIAnalysisStatus>('idle');


  // State for Contact Sheet Analysis
  const [contactSheetStatus, setContactSheetStatus] = useState<ContactSheetStatus>('idle');
  const [imageAnalysisResults, setImageAnalysisResults] = useState<ImageAnalysisResult[]>([]);
  const [contactSheetError, setContactSheetError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  // State for Actions Header
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isDownloadingSorted, setIsDownloadingSorted] = useState(false);

  // UI State
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);


  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setFileName('');
    setCoverData([]);
    setNonCoverData([]);
    setRemovedDuplicates([]);
    setCrossCategoryDuplicates([]);
    setAiFlags([]);
    setAiAnalysisStatus('idle');
    setIsbn(null);
    setTitle(null);
    setOriginalRecordCount(0);
    setOriginalRecords([]);
    setContactSheetStatus('idle');
    setImageAnalysisResults([]);
    setContactSheetError(null);
    setProcessingProgress({ current: 0, total: 0 });
    setCopyStatus('idle');
    setIsDownloading(false);
    setIsMerging(false);
    setIsDownloadingSorted(false);
    setIsInfoPanelOpen(true);
  };

  const handleProcessFile = useCallback(async (file: File, skipAiCheck: boolean) => {
    setStatus('processing');
    setFileName(file.name);
    setError(null);
    setAiFlags([]);
    setAiAnalysisStatus('idle');
    setIsbn(null);
    setTitle(null);
    setOriginalRecordCount(0);
    setOriginalRecords([]);

    try {
      const { records: allRecords, isbn: fileIsbn, title: fileTitle } = await processExcelFile(file);
      setOriginalRecords(allRecords);
      setIsbn(fileIsbn);
      setTitle(fileTitle);
      setOriginalRecordCount(allRecords.length);

      const coverRecords = allRecords.filter(r => isCoverPage(r.pageNumber));
      const nonCoverRecords = allRecords.filter(r => !isCoverPage(r.pageNumber));

      const { uniqueRecords: processedCoverData, duplicates: coverDups } = processGroup(coverRecords);
      const { uniqueRecords: processedNonCoverData, duplicates: nonCoverDups } = processGroup(nonCoverRecords);

      setCoverData(processedCoverData);
      setNonCoverData(processedNonCoverData);
      setRemovedDuplicates([...coverDups, ...nonCoverDups].sort((a,b) => a.source.localeCompare(b.source)));

      const coverAckSet = new Set(processedCoverData.map(r => `${r.source}|${r.acknowledgement}`));
      const crossDups = processedNonCoverData.filter(r => coverAckSet.has(`${r.source}|${r.acknowledgement}`));
      setCrossCategoryDuplicates(crossDups);

      // Show results to user immediately
      setStatus('success');
      
      if (skipAiCheck) {
        setAiAnalysisStatus('skipped');
        return;
      }

      // Start AI analysis in the background
      const runAiAnalysis = async () => {
        setAiAnalysisStatus('running');
        try {
            const allUniqueData = [...processedCoverData, ...processedNonCoverData];
            const flaggedData = await analyzeAcknowledgements(allUniqueData);
            setAiFlags(flaggedData);
            setAiAnalysisStatus('completed');
        } catch (aiError) {
            console.error("AI analysis background task failed:", aiError);
            setAiAnalysisStatus('error');
        }
      };
      
      runAiAnalysis();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setStatus('error');
    }
  }, []);

  const findPageNumberFromText = (text: string): string => {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.join(', ') : 'N/A';
  };

  const getPageNumberFromFilename = (filename: string): string => {
    return filename;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the data URL prefix: "data:image/jpeg;base64,"
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleContactSheetReset = useCallback(() => {
    setContactSheetStatus('idle');
    setContactSheetError(null);
    setImageAnalysisResults([]);
    setProcessingProgress({ current: 0, total: 0 });
  }, []);

  const handleProcessContactSheet = useCallback(async (file: File) => {
    setContactSheetStatus('processing');
    setContactSheetError(null);
    setImageAnalysisResults([]);
    setProcessingProgress({ current: 0, total: 0 });

    try {
        const extractedImages: ExtractedImage[] = await processContactSheet(file);

        setContactSheetStatus('describing');
        setProcessingProgress({ current: 0, total: extractedImages.length });
        
        const currentResults: ImageAnalysisResult[] = extractedImages.map(image => ({
            pageNumber: findPageNumberFromText(image.associatedText),
            description: 'Processing...',
            status: 'processing',
            mimeType: image.mimeType,
            imageBase64: image.imageBase64,
        }));
        setImageAnalysisResults(currentResults);

        const CONCURRENCY_LIMIT = 2;
        let completedCount = 0;
        const queue = [...extractedImages.entries()];

        const worker = async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (!item) continue;
                
                const [index, image] = item;

                try {
                    const description = await describeImage(image.imageBase64, image.mimeType);
                    currentResults[index] = { ...currentResults[index], description, status: 'success' };
                } catch (err) {
                     const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                     currentResults[index] = { ...currentResults[index], description: `Gemini AI image description failed: ${errorMessage}`, status: 'error' };
                }
                completedCount++;
                setProcessingProgress({ current: completedCount, total: extractedImages.length });
                setImageAnalysisResults([...currentResults]);
            }
        };

        const workers = Array(CONCURRENCY_LIMIT).fill(null).map(worker);
        await Promise.all(workers);

        setContactSheetStatus('success');

    } catch (err) {
        if (err instanceof Error) {
            setContactSheetError(err.message);
        } else {
            setContactSheetError('An unexpected error occurred during contact sheet processing.');
        }
        setContactSheetStatus('error');
    }
  }, []);

  const handleProcessDirectImages = useCallback(async (files: File[]) => {
    setContactSheetStatus('describing');
    setContactSheetError(null);
    setProcessingProgress({ current: 0, total: files.length });

    const currentResults: ImageAnalysisResult[] = files.map(file => ({
        pageNumber: getPageNumberFromFilename(file.name),
        description: 'Processing...',
        status: 'processing',
        mimeType: file.type,
        imageBase64: '',
    }));
    setImageAnalysisResults(currentResults);

    const CONCURRENCY_LIMIT = 2;
    let completedCount = 0;
    const queue = [...files.entries()];

    const worker = async () => {
        while(queue.length > 0) {
            const item = queue.shift();
            if (!item) continue;

            const [index, file] = item;
            
            try {
                const base64 = await fileToBase64(file);
                currentResults[index].imageBase64 = base64;
                const description = await describeImage(base64, file.type);
                currentResults[index] = { ...currentResults[index], description, status: 'success' };
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 currentResults[index] = { ...currentResults[index], description: `Gemini AI image description failed: ${errorMessage}`, status: 'error' };
            }
            completedCount++;
            setProcessingProgress({ current: completedCount, total: files.length });
            setImageAnalysisResults([...currentResults]);
        }
    };
    
    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(worker);
    await Promise.all(workers);
    
    setContactSheetStatus('success');
  }, []);
  
  const handleRetryFailedImages = useCallback(async () => {
    const failedImages = imageAnalysisResults.filter(r => r.status === 'error');
    if (failedImages.length === 0) return;

    setContactSheetStatus('describing');
    const totalRetries = failedImages.length;
    const totalOriginal = imageAnalysisResults.length;
    const completedOriginal = totalOriginal - imageAnalysisResults.filter(r => r.status !== 'success').length;

    setProcessingProgress({ current: completedOriginal, total: totalOriginal });
    
    // FIX: Add explicit type annotation to prevent type widening of the `status` property.
    const updatedResults: ImageAnalysisResult[] = imageAnalysisResults.map(r => r.status === 'error' ? { ...r, description: 'Retrying...', status: 'processing' } : r);
    setImageAnalysisResults(updatedResults);

    const CONCURRENCY_LIMIT = 2;
    let completedRetries = 0;
    const queue = [...failedImages];

    const worker = async () => {
        while(queue.length > 0) {
            const imageToRetry = queue.shift();
            if (!imageToRetry) continue;

            const originalIndex = updatedResults.findIndex(r => r.pageNumber === imageToRetry.pageNumber && r.status === 'processing');
            if (originalIndex === -1) continue;
            
            try {
                const description = await describeImage(imageToRetry.imageBase64, imageToRetry.mimeType);
                updatedResults[originalIndex] = { ...imageToRetry, description, status: 'success' };
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 updatedResults[originalIndex] = { ...imageToRetry, description: `Gemini AI image description failed: ${errorMessage}`, status: 'error' };
            }
            completedRetries++;
            setProcessingProgress({ current: completedOriginal + completedRetries, total: totalOriginal });
            setImageAnalysisResults([...updatedResults]);
        }
    };

    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(worker);
    await Promise.all(workers);
    
    setContactSheetStatus('success');
  }, [imageAnalysisResults]);

  // Action handlers
  const sanitizeFilename = (name: string): string => {
    let sanitized = name.replace(/\s+/g, '_');
    sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return sanitized;
  };

  const handleCopy = () => {
      let tsvContent = "Source\tAcknowledgement\tPage Number\n";
      
      if (coverData.length > 0) {
          tsvContent += "--- Cover Credits ---\n";
          tsvContent += coverData.map(row => `${row.source}\t${row.acknowledgement}\t${row.pageNumber}`).join('\n') + '\n';
      }
      if (nonCoverData.length > 0) {
          tsvContent += "--- Main Content Credits ---\n";
          tsvContent += nonCoverData.map(row => `${row.source}\t${row.acknowledgement}\t${row.pageNumber}`).join('\n') + '\n';
      }

      if (removedDuplicates.length > 0) {
          tsvContent += "\n--- Removed Duplicates ---\n";
          tsvContent += removedDuplicates.map(row => `${row.source}\t${row.acknowledgement}\t(Page: ${row.pageNumber})`).join('\n') + '\n';
      }

      if (crossCategoryDuplicates.length > 0) {
          tsvContent += "\n--- Note: Acknowledgements in Both Cover and Main Content ---\n";
          tsvContent += crossCategoryDuplicates.map(row => `${row.source}\t${row.acknowledgement}`).join('\n') + '\n';
      }

      navigator.clipboard.writeText(tsvContent).then(() => {
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2000);
      }).catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Failed to copy data to clipboard.');
      });
  };

  const handleDownloadWord = async () => {
      if (isDownloading) return;
      setIsDownloading(true);

      try {
          const formatGroupToRuns = (data: AcknowledgementRecord[]): any[] => {
              if (!data.length) return [];
      
              const groupedBySource = new Map<string, string[]>();
              data.forEach(record => {
                  const source = record.source;
                  if (!groupedBySource.has(source)) {
                      groupedBySource.set(source, []);
                  }
                  groupedBySource.get(source)!.push(record.acknowledgement);
              });
      
              const runs: any[] = [];
              const sortedSources = Array.from(groupedBySource.keys());
      
              sortedSources.forEach((source, index) => {
                  const acks = groupedBySource.get(source)!;
                  const ackString = acks.join(', ');
      
                  runs.push(new TextRun({ text: source, bold: true }));
                  runs.push(new TextRun(" "));
                  runs.push(new TextRun({ text: "(", bold: true }));
                  runs.push(new TextRun(ackString));
                  runs.push(new TextRun({ text: ")", bold: true }));
      
                  if (index === sortedSources.length - 1) {
                      runs.push(new TextRun("."));
                  } else {
                      runs.push(new TextRun({ text: "; ", bold: true }));
                  }
              });
              
              return runs;
          };
      
          const paragraphs = [
              new Paragraph({
                  text: "Acknowledgements",
                  heading: HeadingLevel.TITLE,
                  alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
          ];

          if (aiAnalysisStatus === 'completed' && aiFlags.length > 0) {
              paragraphs.push(new Paragraph({
                  text: "Data Quality Warning",
                  heading: HeadingLevel.HEADING_2,
              }));
              paragraphs.push(new Paragraph({
                  children: [new TextRun("The AI analysis flagged the following entries as potential errors or anomalies. Please review them carefully:")]
              }));
              aiFlags.forEach(flag => {
                  paragraphs.push(new Paragraph({
                      bullet: { level: 0 },
                      children: [
                          new TextRun({ text: `Source: `, bold: true }),
                          new TextRun(`${flag.source}, `),
                          new TextRun({ text: `Acknowledgement: `, bold: true }),
                          new TextRun(`${flag.acknowledgement}, `),
                          new TextRun({ text: `Page: `, bold: true }),
                          new TextRun(`${flag.pageNumber}. `),
                          new TextRun({ text: `Reason: `, bold: true, break: 1 }),
                          new TextRun({ text: flag.reason, italics: true }),
                      ]
                  }));
              });
              paragraphs.push(new Paragraph({ text: "" }));
          }
      
          const coverRuns = formatGroupToRuns(coverData);
          if (coverRuns.length > 0) {
              paragraphs.push(new Paragraph({
                  children: [ new TextRun({ text: "Cover: ", bold: true }), ...coverRuns ]
              }));
          }
      
          const nonCoverRuns = formatGroupToRuns(nonCoverData);
          if (nonCoverRuns.length > 0) {
              if (coverRuns.length > 0) {
                  paragraphs.push(new Paragraph({ text: "" }));
              }
              paragraphs.push(new Paragraph({ children: nonCoverRuns }));
          }
      
          const doc = new Document({
              sections: [{ children: paragraphs }],
          });
      
          const blob = await Packer.toBlob(doc);
          
          let docName = "Acknowledgements.docx";
          if (isbn && title) {
              const sanitizedTitle = sanitizeFilename(title);
              docName = `Credits_${isbn}_${sanitizedTitle}.docx`;
          }

          saveAs(blob, docName);

      } catch (err) {
          console.error('Failed to generate Word document:', err);
          if (err instanceof Error) {
              alert(`Failed to generate Word document: ${err.message}`);
          } else {
              alert('An unknown error occurred while generating the Word document.');
          }
      } finally {
          setIsDownloading(false);
      }
  };

  const handleMergeAndDownload = async () => {
      if (isMerging) return;
      setIsMerging(true);
  
      try {
          // @ts-ignore
          const XLSX = window.XLSX;
          if (!XLSX) {
              throw new Error('The library for creating Excel files (xlsx) could not be found.');
          }
  
          const originalCredits = [...coverData, ...nonCoverData];
          const imageCredits = imageAnalysisResults;
  
          const headers = ["Acknowledgement", "Page Number", "Image Filename", "AI Description"];
          const mergedRows = [];
  
          const maxRows = Math.max(originalCredits.length, imageCredits.length);
  
          for (let i = 0; i < maxRows; i++) {
              const original = originalCredits[i];
              const image = imageCredits[i];
  
              mergedRows.push([
                  original ? original.acknowledgement : '',
                  original ? original.pageNumber : '',
                  image ? image.pageNumber : '', // pageNumber in ImageAnalysisResult is the filename
                  image ? image.description : '',
              ]);
          }
  
          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...mergedRows]);
          worksheet['!cols'] = [ { wch: 50 }, { wch: 15 }, { wch: 40 }, { wch: 80 } ];
          
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Merged Credits");
          
          let docName = "Merged_Credits_Data.xlsx";
          if (isbn && title) {
              const sanitizedTitle = sanitizeFilename(title);
              docName = `Merged_Credits_${isbn}_${sanitizedTitle}.xlsx`;
          }
          XLSX.writeFile(workbook, docName);
  
      } catch (err) {
          console.error("Failed to merge and download Excel file:", err);
          if (err instanceof Error) {
              alert(`Failed to generate merged Excel file: ${err.message}`);
          } else {
              alert("An unknown error occurred while generating the merged Excel file.");
          }
      } finally {
          setIsMerging(false);
      }
  };

  const handleDownloadSortedOriginal = () => {
      if (isDownloadingSorted) return;
      setIsDownloadingSorted(true);

      try {
          // @ts-ignore
          const XLSX = window.XLSX;
          if (!XLSX) {
              throw new Error('The library for creating Excel files (xlsx) could not be found.');
          }

          const sortedRecords = [...originalRecords].sort((a, b) => {
              const sourceCompare = a.source.localeCompare(b.source);
              if (sourceCompare !== 0) {
                  return sourceCompare;
              }
              return a.acknowledgement.localeCompare(b.acknowledgement);
          });

          const headers = ["Source", "Acknowledgement", "Page Number"];
          const data = sortedRecords.map(record => [record.source, record.acknowledgement, record.pageNumber]);

          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
          worksheet['!cols'] = [ { wch: 40 }, { wch: 60 }, { wch: 15 } ];
          
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Sorted Original Credits");

          let docName = "Sorted_Original_Credits.xlsx";
          if (isbn && title) {
              const sanitizedTitle = sanitizeFilename(title);
              docName = `Sorted_Original_Credits_${isbn}_${sanitizedTitle}.xlsx`;
          }
          XLSX.writeFile(workbook, docName);

      } catch (err) {
          console.error("Failed to generate sorted original Excel file:", err);
          if (err instanceof Error) {
              alert(`Failed to generate sorted original Excel file: ${err.message}`);
          } else {
              alert("An unknown error occurred while generating the sorted original Excel file.");
          }
      } finally {
          setIsDownloadingSorted(false);
      }
  };

  const totalSources = new Set([...coverData.map(d => d.source), ...nonCoverData.map(d => d.source)]).size;

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <FileUpload onFileSelect={handleProcessFile} />
          </div>
        );
      case 'processing':
        return (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="text-center p-10">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-slate-600 font-semibold">Processing your file...</p>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="flex gap-6">
            <div className="flex-grow bg-white rounded-xl shadow-lg p-4 sm:p-8 transition-all duration-300">
              <ResultsTable 
                coverData={coverData}
                nonCoverData={nonCoverData}
                onProcessContactSheet={handleProcessContactSheet}
                onProcessDirectImages={handleProcessDirectImages}
                onResetContactSheet={handleContactSheetReset}
                contactSheetStatus={contactSheetStatus}
                imageAnalysisResults={imageAnalysisResults}
                contactSheetError={contactSheetError}
                processingProgress={processingProgress}
                onRetryFailedImages={handleRetryFailedImages}
              />
            </div>
            <InfoPanel 
              isOpen={isInfoPanelOpen}
              onToggle={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
              fileName={fileName}
              title={title}
              isbn={isbn}
              originalRecordCount={originalRecordCount}
              totalSources={totalSources}
              coverCreditsCount={coverData.length}
              mainCreditsCount={nonCoverData.length}
              aiAnalysisStatus={aiAnalysisStatus}
              aiFlags={aiFlags}
              removedDuplicates={removedDuplicates}
              crossCategoryDuplicates={crossCategoryDuplicates}
            />
          </div>
        );
      case 'error':
        return (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="text-center p-10 bg-red-50 rounded-lg">
              <ErrorIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700">Processing Failed</h3>
              <p className="text-slate-600 mt-2 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        );
    }
  };

  const menuItems = [
    { label: 'Process Another file', onClick: handleReset },
    { label: 'Help', onClick: () => {} }
  ];

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <DropdownMenu items={menuItems} />
          <div className="text-left">
            <h1 className="text-4xl font-bold text-slate-800">Credits Helper</h1>
            <p className="text-slate-500 mt-2">Create final credit log from assessment log</p>
          </div>
        </div>
        {status === 'success' && (
          <ActionsHeader 
            isMerging={isMerging}
            isDownloading={isDownloading}
            isDownloadingSorted={isDownloadingSorted}
            copyStatus={copyStatus}
            contactSheetStatus={contactSheetStatus}
            imageAnalysisResults={imageAnalysisResults}
            onMergeAndDownload={handleMergeAndDownload}
            onDownloadWord={handleDownloadWord}
            onDownloadSortedOriginal={handleDownloadSortedOriginal}
            onCopy={handleCopy}
          />
        )}
      </header>
      {renderContent()}
    </main>
  );
};

export default App;