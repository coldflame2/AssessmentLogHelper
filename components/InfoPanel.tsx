import React from 'react';
import type { AcknowledgementRecord, AIFlaggedRecord, AIAnalysisStatus } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ErrorIcon } from './icons/ErrorIcon';
import { SuccessIcon } from './icons/SuccessIcon';


interface InfoPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    fileName: string;
    title: string | null;
    isbn: string | null;
    originalRecordCount: number;
    totalSources: number;
    coverCreditsCount: number;
    mainCreditsCount: number;
    aiAnalysisStatus: AIAnalysisStatus;
    aiFlags: AIFlaggedRecord[];
    removedDuplicates: AcknowledgementRecord[];
    crossCategoryDuplicates: AcknowledgementRecord[];
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
    isOpen,
    onToggle,
    fileName,
    title,
    isbn,
    originalRecordCount,
    totalSources,
    coverCreditsCount,
    mainCreditsCount,
    aiAnalysisStatus,
    aiFlags,
    removedDuplicates,
    crossCategoryDuplicates,
}) => {

    const renderAiFlagsContent = (flags: AIFlaggedRecord[]) => (
        <>
            <p className="text-orange-700 mt-1">The AI flagged the following entries as potential errors. Please review them:</p>
            <ul className="list-disc list-inside mt-2 text-orange-600 max-h-48 overflow-y-auto space-y-1">
                {flags.map((item, i) => (
                    <li key={i}>
                        <strong>{item.source} / {item.acknowledgement}</strong> (Page: {item.pageNumber})
                        <br/>
                        <em className="text-orange-800 pl-2">&rarr; AI reason: {item.reason}</em>
                    </li>
                ))}
            </ul>
        </>
    );

    const renderAiAnalysisSection = () => {
        switch (aiAnalysisStatus) {
            case 'running':
                return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4 animate-pulse">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div>
                            <h4 className="font-semibold text-blue-800">AI Data Quality Check...</h4>
                            <p className="text-blue-700 mt-1 text-xs">Analyzing data for anomalies.</p>
                        </div>
                    </div>
                );
            case 'completed':
                if (aiFlags.length > 0) {
                    return (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-semibold text-orange-800 flex items-center gap-2 pr-2"><ErrorIcon className="w-5 h-5"/> AI Check Complete</h4>
                            {renderAiFlagsContent(aiFlags)}
                        </div>
                    );
                }
                return (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <SuccessIcon className="w-5 h-5 text-green-600"/>
                        <p className="font-semibold text-green-800">AI Data Quality Check Complete. No issues found.</p>
                    </div>
                );
            case 'skipped':
                return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="font-semibold text-slate-700">AI Data Quality Check was skipped.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 flex items-center gap-2"><ErrorIcon className="w-5 h-5"/> AI Data Quality Check Failed</h4>
                        <p className="text-red-700 mt-1">The AI analysis could not be completed. You can still use the sorted data.</p>
                    </div>
                 );
            default:
                return null;
        }
    }


    return (
        <aside className={`relative transition-all duration-300 flex-shrink-0 ${isOpen ? 'w-96' : 'w-12'}`}>
            <div className={`h-full bg-white rounded-xl shadow-lg transition-all duration-300 overflow-hidden`}>
                <div className="absolute top-4 right-2 z-10">
                    <button 
                        onClick={onToggle} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        aria-label={isOpen ? "Collapse panel" : "Expand panel"}
                    >
                        <ChevronRightIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <div className="p-6 h-full overflow-y-auto">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pr-8">
                        <InfoIcon className="w-6 h-6 text-blue-600" />
                        <span>Information</span>
                    </h2>

                    <div className="mt-6 space-y-6">
                        {/* Process Results Section */}
                        <section>
                             <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Process Results</h3>
                             <div className="text-sm space-y-1 text-slate-600">
                                <p><strong>File:</strong> <span className="font-medium text-slate-800 break-all">{fileName}</span></p>
                                {title && <p><strong>Title:</strong> <span className="font-medium text-slate-800">{title}</span></p>}
                                {isbn && <p><strong>ISBN:</strong> <span className="font-medium text-slate-800">{isbn}</span></p>}
                             </div>
                        </section>

                        {/* Summary Section */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Summary</h3>
                            <ul className="text-sm space-y-2 text-slate-600">
                                <li className="flex justify-between items-center"><span>Total Sources:</span> <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{totalSources}</span></li>
                                <li className="flex justify-between items-center"><span>Cover Credits:</span> <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{coverCreditsCount}</span></li>
                                <li className="flex justify-between items-center"><span>Main Credits:</span> <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{mainCreditsCount}</span></li>
                                <li className="pt-2 border-t mt-2 flex justify-between items-center"><strong>Original Entries:</strong> <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">{originalRecordCount}</span></li>
                            </ul>
                        </section>

                        {/* Data Health Section */}
                         <section>
                            <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Data Health</h3>
                            <div className="space-y-4 text-sm">
                                {renderAiAnalysisSection()}
                                {(removedDuplicates.length > 0 || crossCategoryDuplicates.length > 0) && (
                                    <details className="group bg-slate-50 border border-slate-200 rounded-lg overflow-hidden transition-all duration-300">
                                        <summary className="p-4 cursor-pointer flex justify-between items-center font-semibold text-slate-700 hover:bg-slate-100 list-none">
                                            <span>View Duplicate Information</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" >
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </summary>
                                        <div className="p-4 border-t border-slate-200 space-y-4">
                                            {removedDuplicates.length > 0 && (
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <h4 className="font-semibold text-yellow-800">Removed Duplicates</h4>
                                                    <p className="text-yellow-700">The following duplicate entries were found within their respective sections and removed:</p>
                                                    <ul className="list-disc list-inside mt-2 text-yellow-600 max-h-24 overflow-y-auto">
                                                        {removedDuplicates.map((item, i) => <li key={i}><strong>{item.source}:</strong> {item.acknowledgement}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {crossCategoryDuplicates.length > 0 && (
                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <h4 className="font-semibold text-blue-800">Cover and Main</h4>
                                                    <p className="text-blue-700">The following acknowledgements appear in both Cover and Main Content sections (both entries were kept):</p>
                                                    <ul className="list-disc list-inside mt-2 text-blue-600 max-h-24 overflow-y-auto">
                                                        {crossCategoryDuplicates.map((item, i) => <li key={i}><strong>{item.source}:</strong> {item.acknowledgement}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </aside>
    );
};
