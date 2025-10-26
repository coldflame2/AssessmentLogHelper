
import type { AcknowledgementRecord, ProcessedExcelData } from '../types';

const findMetadata = (data: (string | number)[][]): { isbn: string | null, title: string | null } => {
    let isbn: string | null = null;
    let title: string | null = null;
    const searchDepth = 5; // Search the first 5 rows for metadata

    for (let r = 0; r < Math.min(data.length, searchDepth); r++) {
        const row = data[r];
        if (!Array.isArray(row)) continue;

        for (let c = 0; c < row.length - 1; c++) {
            const cellValue = String(row[c]).toLowerCase().trim();
            const nextCellValue = String(row[c + 1]).trim();

            if (cellValue.includes('isbn') && !isbn) {
                isbn = nextCellValue;
            }
            if (cellValue.includes('title') && !title) {
                title = nextCellValue;
            }
        }
        if (isbn && title) break; // Stop searching once both are found
    }
    return { isbn, title };
};


const findHeaders = (data: (string | number)[][]): { headerRowIndex: number; sourceColIndex: number; ackColIndex: number, pageColIndex: number } => {
  let headerRowIndex = -1;
  let sourceColIndex = -1;
  let ackColIndex = -1;
  let pageColIndex = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    const lowerCaseRow = row.map(cell => typeof cell === 'string' ? cell.toLowerCase().trim() : '');
    
    const tempSourceIndex = lowerCaseRow.indexOf('source');
    const tempAckIndex = lowerCaseRow.indexOf('acknowledgement');
    const tempPageIndex = lowerCaseRow.indexOf('page number');

    if (tempSourceIndex !== -1 && tempAckIndex !== -1 && tempPageIndex !== -1) {
      headerRowIndex = i;
      sourceColIndex = tempSourceIndex;
      ackColIndex = tempAckIndex;
      pageColIndex = tempPageIndex;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find all required columns: "source", "acknowledgement", and "page number". Please check the Excel file for these headers.');
  }

  return { headerRowIndex, sourceColIndex, ackColIndex, pageColIndex };
};

export const processExcelFile = (file: File): Promise<ProcessedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        // @ts-ignore
        const XLSX = window.XLSX;
        if (!XLSX) {
            throw new Error('The library for reading Excel files (xlsx) could not be found. Please check your internet connection and try again.');
        }

        if (!e.target?.result) {
          return reject(new Error('Failed to read file.'));
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let processedData: ProcessedExcelData | null = null;

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) continue;

            try {
                const { headerRowIndex, sourceColIndex, ackColIndex, pageColIndex } = findHeaders(jsonData);
                const metadata = findMetadata(jsonData);
                
                const sheetRecords: AcknowledgementRecord[] = [];
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!Array.isArray(row)) continue;
                    
                    const source = row[sourceColIndex];
                    const acknowledgement = row[ackColIndex];
                    const pageNumber = row[pageColIndex];

                    if (source && acknowledgement) {
                        sheetRecords.push({
                            source: String(source).trim(),
                            acknowledgement: String(acknowledgement).trim(),
                            pageNumber: pageNumber !== undefined && pageNumber !== null ? String(pageNumber).trim() : '',
                        });
                    }
                }
                
                processedData = {
                    records: sheetRecords,
                    isbn: metadata.isbn,
                    title: metadata.title,
                    fullData: jsonData,
                };
                break; // Found and processed the correct sheet, exit loop
            } catch (error) {
                // Headers not in this sheet, continue to the next
                continue;
            }
        }
        
        if (processedData === null) {
            return reject(new Error('Could not find "source", "acknowledgement", and "page number" columns in any sheet. Please check your Excel file.'));
        }

        if (processedData.records.length === 0) {
            reject(new Error("No data rows found under the required headers."));
        } else {
            resolve(processedData);
        }

      } catch (error) {
        if (error instanceof Error) {
            reject(error);
        } else {
            reject(new Error('An unknown error occurred during file processing.'));
        }
      }
    };

    reader.onerror = (error) => {
      reject(new Error('File reading error: ' + error));
    };

    reader.readAsArrayBuffer(file);
  });
};
