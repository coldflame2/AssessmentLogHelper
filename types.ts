import type { UniverSheet } from '@univerjs/core';

export interface AcknowledgementRecord {
  source: string;
  acknowledgement: string;
  pageNumber: string;
  usageClassification: string;
  licenseFee: string;
  originalRowIndex: number;
}

export type AppStatus = 'idle' | 'processing' | 'success' | 'error';
export type AIAnalysisStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped';

export type AIFlaggedRecord = AcknowledgementRecord & {
  reason: string;
};

export interface ProcessedExcelData {
  records: AcknowledgementRecord[];
  isbn: string | null;
  title: string | null;
  rawData: (string | number)[][];
  headerRowIndex: number;
}

// Types for Image Analysis Feature
export interface ExtractedImage {
  imageBase64: string;
  mimeType: string;
  associatedText: string;
}

export interface ImageAnalysisResult {
  pageNumber: string;
  description: string;
  status: 'success' | 'error' | 'processing';
  // Data needed for display and retry
  mimeType: string;
  imageBase64: string;
}

export type ContactSheetStatus = 'idle' | 'processing' | 'describing' | 'success' | 'error';