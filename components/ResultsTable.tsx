import React from 'react';
import type { AcknowledgementRecord, ContactSheetStatus, ImageAnalysisResult } from '../types';
import { ImageAnalysis } from './ImageAnalysis';


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
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.source}</td>
        <td className="px-6 py-4 whitespace-normal text-sm text-slate-600">{item.acknowledgement}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{item.pageNumber}</td>
      </tr>
    ))}
  </>
);

export const ResultsTable: React.FC<ResultsTableProps> = (props) => {
    const { 
        coverData, nonCoverData, 
    } = props;
    
  return (
    <div className="animate-fade-in flex flex-col gap-8">
        <div className="w-full">
            <div className="overflow-auto max-h-[80vh] border border-slate-200 rounded-lg shadow-inner">
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                    <th scope="col" className="w-1/3 px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Source
                    </th>
                    <th scope="col" className="w-2/3 px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Acknowledgement
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Page
                    </th>
                    </tr>
                </thead>
                    {coverData.length > 0 && (
                        <tbody className="bg-white divide-y divide-slate-200">
                            <tr><td colSpan={3} className="px-4 py-2 bg-slate-200 text-sm font-semibold text-slate-700">Cover Credits</td></tr>
                            {renderTableRows(coverData)}
                        </tbody>
                    )}
                    {nonCoverData.length > 0 && (
                        <tbody className="bg-white divide-y divide-slate-200">
                            {coverData.length > 0 && <tr><td colSpan={3} className="p-2 bg-slate-300"></td></tr>}
                            <tr><td colSpan={3} className="px-4 py-2 bg-slate-200 text-sm font-semibold text-slate-700">Main Content Credits</td></tr>
                            {renderTableRows(nonCoverData)}
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