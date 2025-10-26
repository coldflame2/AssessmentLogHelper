
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File, skipAiCheck: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [skipAiCheck, setSkipAiCheck] = useState(true);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
        onFileSelect(file, skipAiCheck);
      } else {
        alert('Please upload a valid Excel file (.xlsx or .xls).');
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [onFileSelect, skipAiCheck]);


  return (
    <>
      <div 
        className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          type="file"
          id="file-input"
          className="hidden"
          accept=".xlsx, .xls"
          onChange={(e) => handleFileChange(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center">
          <UploadIcon className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-lg font-semibold text-slate-700">
            Drag & drop your Excel file here
          </p>
          <p className="text-slate-500 mt-1">
            or <span className="text-blue-600 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-4">Supports .xlsx and .xls files</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center">
        <label htmlFor="skip-ai-check" className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              id="skip-ai-check" 
              type="checkbox" 
              className="sr-only" 
              checked={skipAiCheck} 
              onChange={() => setSkipAiCheck(!skipAiCheck)} 
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${skipAiCheck ? 'bg-slate-400' : 'bg-blue-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${skipAiCheck ? 'transform translate-x-0' : 'transform translate-x-6'}`}></div>
          </div>
          <div className="ml-3 text-slate-600 font-medium text-sm">
            Enable AI Data Quality Check
          </div>
        </label>
      </div>
    </>
  );
};