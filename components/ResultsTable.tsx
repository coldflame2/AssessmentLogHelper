import React, { useState } from 'react';
import type { AcknowledgementRecord, ContactSheetStatus, ImageAnalysisResult } from '../types';
import { ImageAnalysis } from './ImageAnalysis';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface ResultsTableProps {
  coverData: AcknowledgementRecord[];
  nonCoverData: AcknowledgementRecord[];
  onProcessContactSheet: (file: File) => void;
  onProcessDirectImages: (files: File[]) => void;
  onResetContactSheet: () => void;
  onRetryFailedImages: () => void;
  contactSheetStatus: ContactSheetStatus;
  imageAnalysisResults: ImageAnalysisResult[];
  contactSheetError: string | null;
  processingProgress: { current: number; total: number };
}

const renderTableRows = (data: AcknowledgementRecord[]) => (
  <>
    {data.map((item, index) => (
      <tr key={index} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
        <td className="px-1 py-1 whitespace-nowrap text-sm font-medium text-slate-800">{item.source}</td>
        <td className="px-1 py-1 whitespace-normal text-sm text-slate-600">{item.acknowledgement}</td>
        <td className="px-1 py-1 whitespace-nowrap text-sm text-slate-600 text-center">{item.pageNumber}</td>
      </tr>
    ))}
  </>
);

export const ResultsTable: React.FC<ResultsTableProps> = (props) => {
    const { 
        coverData, nonCoverData, 
    } = props;

    const [isCoverExpanded, setIsCoverExpanded] = useState(false);
    const [isMainExpanded, setIsMainExpanded] = useState(false);
    
  return (
    <div className="animate-fade-in flex flex-col gap-1">
        <div className="w-full">
            <div className="overflow-auto max-h-[80vh] border border-slate-200 rounded-lg shadow-inner">
                <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50 sticky top-0 z-2">
                    <tr>
                    <th scope="col" className="w-1/3 px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        Source
                    </th>
                    <th scope="col" className="w-2/3 px-6 py-4 text-left text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        Acknowledgement
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        Page
                    </th>
                    </tr>
                </thead>
                    {coverData.length > 0 && (
                        <tbody className="bg-white divide-y divide-slate-200">
                            <tr>
                                <td colSpan={3} className="px-2 py-1">
                                     <button
                                        onClick={() => setIsCoverExpanded(!isCoverExpanded)}
                                        className="inline-flex items-center gap-3 px-4 py-2 bg-slate-200 text-black text-base rounded-md hover:bg-slate-300 transition-colors shadow-sm"
                                    >
                                        <span>Cover Credits</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${!isCoverExpanded ? 'rotate-0' : 'rotate-180'}`} />
                                    </button>
                                </td>
                            </tr>
                            {isCoverExpanded && renderTableRows(coverData)}
                        </tbody>
                    )}
                    {nonCoverData.length > 0 && (
                        <tbody className="bg-white divide-y divide-slate-200">
                             <tr>
                                <td colSpan={3} className="px-2 py-2">
                                     <button
                                        onClick={() => setIsMainExpanded(!isMainExpanded)}
                                        className="inline-flex items-center gap-3 px-4 py-2 bg-slate-200 text-black text-base rounded-md hover:bg-slate-300 transition-colors shadow-sm"
                                    >
                                        <span>Main Content Credits</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${!isMainExpanded ? 'rotate-0' : 'rotate-180'}`} />
                                    </button>
                                </td>
                            </tr>
                            {isMainExpanded && renderTableRows(nonCoverData)}
                        </tbody>
                    )}
                </table>
            </div>
        </div>
        
        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-200 mt-4">
             <ImageAnalysis {...props} />
        </div>
    </div>
  );
};