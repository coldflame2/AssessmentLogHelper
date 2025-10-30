
import type { AcknowledgementRecord, AIFlaggedRecord } from '../types';

const normalizeText = (text: string): string => {
    // Treat hyphens, slashes as word separators and ignore case.
    return (text || '').toLowerCase().replace(/[-/]/g, ' ');
};

/**
 * Validates records based on a set of concrete rules.
 * @param records - The array of records to validate.
 * @returns An array of flagged records with reasons for the flag.
 */
export const validateData = (records: AcknowledgementRecord[]): AIFlaggedRecord[] => {
    const flags: AIFlaggedRecord[] = [];

    records.forEach(record => {
        const normalizedUsage = normalizeText(record.usageClassification);

        // Rule 1: "No License" in Usage Classification requires Licence Fee to be 0.
        if (normalizedUsage.includes('no license')) {
            const feeValue = record.licenseFee.trim();
            // A fee of '0' or '0.00' is valid. An empty string is not.
            const fee = parseFloat(feeValue);
            if (feeValue === '' || isNaN(fee) || fee !== 0) {
                flags.push({
                    ...record,
                    reason: `Usage is "${record.usageClassification}" but Licence Fee is "${feeValue || 'empty'}", not 0.`
                });
            }
        } 
        // Rule 2: "License" in Usage Classification (and not "No License") requires Licence Fee to be a positive number.
        else if (normalizedUsage.includes('license')) {
            const feeValue = record.licenseFee.trim();
            const fee = parseFloat(feeValue);
            // An empty string is not a positive number.
            if (feeValue === '' || isNaN(fee) || fee <= 0) {
                flags.push({
                    ...record,
                    reason: `Usage is "${record.usageClassification}" but Licence Fee is "${feeValue || 'empty'}", which is not a positive number.`
                });
            }
        }
    });

    return flags;
};