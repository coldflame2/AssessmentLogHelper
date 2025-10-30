import React, { useEffect, useRef, useState } from 'react';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';


interface UniverEditorProps {
  data: (string | number)[][];
  highlightedRowIndices: number[];
}

/**
 * Converts a 2D array of data into the IWorksheetData format required by Univer,
 * applying a highlight style to specified rows.
 * @param data The 2D array of spreadsheet data.
 * @param highlightedIndices A set of row indices to highlight.
 * @returns The data in Univer's worksheet data format, including styles.
 */
const transformDataForUniver = (data: (string | number)[][], highlightedIndices: Set<number>) => {
    const cellData: { [key: string]: { [key:string]: { v: string | number | null, s?: string } } } = {};
    const highlightStyleId = 'highlightStyle';
    const styles = {
        [highlightStyleId]: {
            bg: { rgb: 'rgb(254, 226, 226)' } // light red for validation error
        }
    };
    const rowCount = data.length;
    let colCount = 0;
    data.forEach((row, r) => {
        colCount = Math.max(colCount, row.length);
        cellData[r] = {};
        const isHighlighted = highlightedIndices.has(r);
        row.forEach((cell, c) => {
            if (cell !== null && cell !== undefined && cell !== '') {
                cellData[r][c] = { v: cell };
                if (isHighlighted) {
                    cellData[r][c].s = highlightStyleId;
                }
            }
        });
    });
    return {
        rowCount,
        columnCount: colCount,
        cellData,
        styles
    };
};


export const UniverEditor: React.FC<UniverEditorProps> = ({ data, highlightedRowIndices }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerInstanceRef = useRef<any>(null); // Ref to hold the Univer instance
    const [isEditorReady, setIsEditorReady] = useState(false);

    useEffect(() => {
        // Initialize editor only once when the component mounts
        if (containerRef.current && !univerInstanceRef.current) {
            const highlightedIndicesSet = new Set(highlightedRowIndices);
            const { styles, ...worksheetConfig } = transformDataForUniver(data, highlightedIndicesSet);

            const workbookData = {
                id: 'workbook-1',
                sheetOrder: ['sheet-1'],
                styles,
                sheets: {
                    'sheet-1': {
                        id: 'sheet-1',
                        name: 'Original Log',
                        ...worksheetConfig,
                    },
                },
            };

            const { univerAPI } = createUniver({
                locale: LocaleType.EN_US,
                locales: {
                    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
                },
                presets: [
                    UniverSheetsCorePreset({
                        container: containerRef.current,
                        header: true,
                        toolbar: true,
                        footer: true,
                    }),
                ],
            });

            univerInstanceRef.current = univerAPI;
            univerAPI.createWorkbook(workbookData);
            setIsEditorReady(true);
        }

        // Cleanup function runs when component unmounts
        return () => {
            if (univerInstanceRef.current) {
                univerInstanceRef.current.dispose();
                univerInstanceRef.current = null;
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!isEditorReady && (
                 <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-lg">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600 font-semibold">Loading Spreadsheet Editor...</p>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '100%', visibility: isEditorReady ? 'visible' : 'hidden' }} />
        </div>
    );
};