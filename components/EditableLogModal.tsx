import React from 'react';
import { UniverEditor } from './UniverEditor';

interface EditableLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: (string | number)[][];
  highlightedRowIndices: number[];
}

export const EditableLogModal: React.FC<EditableLogModalProps> = ({
  isOpen,
  onClose,
  data,
  highlightedRowIndices,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center animate-fade-in-fast"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Edit Original Log</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close editor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow relative">
          <UniverEditor data={data} highlightedRowIndices={highlightedRowIndices} />
        </main>
      </div>
    </div>
  );
};