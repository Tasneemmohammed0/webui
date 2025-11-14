/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TableHeader,
  DataTable,
  DataTableSkeleton,
  Dropdown,
  TableToolbarSearch,
  TableToolbarContent,
} from '@carbon/react';
import { TableRowProps } from '@carbon/react/lib/components/DataTable/TableRow';
import { TableHeadProps } from '@carbon/react/lib/components/DataTable/TableHead';
import { TableBodyProps } from '@carbon/react/lib/components/DataTable/TableBody';
import { DataTableHeader, DataTableRow } from '@/utils/interfaces';
import { get3270Screenshots } from '@/utils/3270/get3270Screenshots';
import { useTranslations } from 'next-intl';
import { TreeNodeData } from '@/utils/functions/artifacts';
import styles from '@/styles/test-runs/test-run-details/Tab3270.module.css';
import { CellFor3270, TerminalImage, DropdownOption } from '@/utils/interfaces/3270Terminal';

export default function TableOfScreenshots({
  runId,
  zos3270TerminalData,
  isLoading,
  setIsError,
  setIsLoading,
  setImageData,
  moveImageSelection,
  setMoveImageSelection,
  setCannotSwitchToPreviousImage,
  setCannotSwitchToNextImage,
  highlightedRowInDisplayedData,
  setHighlightedRowInDisplayedData,
  highlightedRowId,
  setHighlightedRowId,
}: {
  runId: string;
  zos3270TerminalData: TreeNodeData[];
  isLoading: boolean;
  setIsError: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setImageData: React.Dispatch<React.SetStateAction<TerminalImage | undefined>>;
  moveImageSelection: number;
  setMoveImageSelection: React.Dispatch<React.SetStateAction<number>>;
  setCannotSwitchToPreviousImage: React.Dispatch<React.SetStateAction<boolean>>;
  setCannotSwitchToNextImage: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedRowInDisplayedData: boolean;
  setHighlightedRowInDisplayedData: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedRowId: string;
  setHighlightedRowId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const translations = useTranslations('3270Tab');
  const headers = [
    {
      key: 'Terminal',
      header: translations('Terminal'),
    },
    {
      key: 'screenNumber',
      header: translations('screenNumber'),
    },
  ];

  const [flattenedZos3270TerminalData, setFlattenedZos3270TerminalData] = useState<CellFor3270[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState<DropdownOption | null>(null);
  const [allImageData, setAllImageData] = useState<TerminalImage[]>([]);
  const [initialHighlightedRowSet, setInitialHighlightedRowSet] = useState<boolean>(false);

  const screenshotsCollected = useRef<boolean | null>(false);

  const handleRowClick = (rowId: string) => {
    setHighlightedRowId(rowId);
  };

  const terminalnames = useMemo(() => {
    const names = new Set(flattenedZos3270TerminalData.map((row: CellFor3270) => row.Terminal));
    return [
      { id: 'all', label: 'All' },
      ...Array.from(names).map((name) => ({ id: name, label: name })),
    ];
  }, [flattenedZos3270TerminalData]);

  const filteredRows = useMemo(() => {
    let result: CellFor3270[] = flattenedZos3270TerminalData;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter((row: CellFor3270) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(lowerCaseSearchTerm)
        )
      );
    }

    if (selectedTerminal && selectedTerminal.id !== 'all') {
      result = result.filter((row) => row.Terminal === selectedTerminal.id);
    }

    return result;
  }, [searchTerm, selectedTerminal, flattenedZos3270TerminalData]);

  useEffect(() => {
    // Highlight and display first element when the page loads, unless already set.
    const highlightFirstRowOnPageLoad = () => {
      if (!initialHighlightedRowSet && filteredRows[0]) {
        setInitialHighlightedRowSet(true);
        if (
          highlightedRowId === '' ||
          !filteredRows.find((filteredRow) => filteredRow.id === highlightedRowId)
        ) {
          setHighlightedRowId(filteredRows[0].id);
        }
      }
    };

    // When the filtered rows change, ensure the buttons to move to the next/ previous images are disabled.
    const checkHighlightedRowInFilteredRows = () => {
      if (filteredRows.findIndex((row) => row.id === highlightedRowId) >= 0) {
        setHighlightedRowInDisplayedData(true);
      } else {
        setHighlightedRowInDisplayedData(false);
      }
    };

    highlightFirstRowOnPageLoad();
    checkHighlightedRowInFilteredRows();

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [filteredRows, highlightedRowId]);

  useEffect(() => {
    // Ensure screenshots are only collected once.
    if (!screenshotsCollected.current?.valueOf() && flattenedZos3270TerminalData.length === 0) {
      screenshotsCollected.current = true;
      setIsLoading(true);
      const fetchData = async () => {
        try {
          setFlattenedZos3270TerminalData([]);
          setAllImageData([]);
          const { newFlattenedZos3270TerminalData, newAllImageData } = await get3270Screenshots(
            zos3270TerminalData,
            runId
          );
          setFlattenedZos3270TerminalData(newFlattenedZos3270TerminalData);
          setAllImageData(newAllImageData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setIsError(true);
          setIsLoading(false);
        }
      };

      fetchData();
    }

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, []);

  // When highlighted image changes, update image data.
  useEffect(() => {
    const newImageData: TerminalImage = allImageData.find(
      (image) => image.id === highlightedRowId
    ) as TerminalImage;

    setImageData(newImageData);

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [highlightedRowId, allImageData]);

  // Handle previous/ next image buttons.
  useEffect(() => {
    if (highlightedRowId != '' && highlightedRowInDisplayedData) {
      const currentImgIndex = filteredRows.findIndex((row) => row.id === highlightedRowId);
      // MoveImageSelection will be -1 if moving to the previous image, or 1 if moving to the next.
      const newIndex = currentImgIndex + moveImageSelection;
      const filteredRowsLength = filteredRows.length;

      if (newIndex >= 0 && newIndex < filteredRowsLength) {
        setHighlightedRowId(filteredRows[newIndex].id);
        if (filteredRows[newIndex]) {
          const selectedTableRow = document.getElementById(filteredRows[newIndex].id);
          if (selectedTableRow) {
            selectedTableRow.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }
        }
      }
      // Check for boundary items in screenshot table.
      setCannotSwitchToPreviousImage(newIndex === 0);
      setCannotSwitchToNextImage(newIndex === filteredRowsLength - 1);

      setMoveImageSelection(0);
    }

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [
    moveImageSelection,
    filteredRows,
    highlightedRowInDisplayedData,
    highlightedRowId,
    searchTerm,
  ]);

  if (isLoading) {
    return (
      <div className={styles.loadingTable}>
        <div className={styles.tableToolSearchBar}>
          <TableToolbarSearch
            placeholder={translations('searchPlaceholder')}
            persistent
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
            }}
          />
        </div>

        <DataTableSkeleton
          role="loading-table-skeleton"
          columnCount={headers.length}
          rowCount={8}
        />
      </div>
    );
  }
  return (
    <>
      {/* TableToolbarContent cannot go inside DataTable due to conflicting stickyHeader prop causing dropdown to underlap the table */}
      <div className={styles.tableToolSearchBar}>
        <TableToolbarContent>
          <TableToolbarSearch
            placeholder={translations('searchPlaceholder')}
            persistent
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
            }}
          />
          {/* Length must be greater than 2 due to one of the terminal names being "any". */}
          {terminalnames.length > 2 && (
            <Dropdown
              className={styles.terminalDropdownMenu}
              label="Select a terminal"
              items={terminalnames}
              itemToString={(item: DropdownOption | null) => (item ? item.label : '')}
              onChange={({ selectedItem }: { selectedItem: DropdownOption | null }) => {
                setSelectedTerminal(selectedItem);
              }}
              selectedItem={selectedTerminal}
            />
          )}
        </TableToolbarContent>
      </div>

      <DataTable rows={filteredRows} headers={headers} stickyHeader>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
        }: {
          rows: DataTableRow[];
          headers: DataTableHeader[];
          getHeaderProps: (options: any) => TableHeadProps;
          getRowProps: (options: any) => TableRowProps;
          getTableProps: () => TableBodyProps;
        }) => (
          <Table stickyHeader {...getTableProps()} className={styles.innerScreenshotTable}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader key={header.header} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  id={row.id}
                  {...getRowProps({ row })}
                  onClick={() => handleRowClick(row.id)}
                  className={styles.clickableRow}
                  role="table-row"
                >
                  {row.cells.map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        backgroundColor:
                          highlightedRowId === row.id
                            ? 'rgba(124, 124, 124, 0.468)'
                            : 'transparent',
                      }}
                    >
                      {cell.value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </>
  );
}
