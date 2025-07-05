/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";

import { Run } from "@/generated/galasaapi";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Pagination,
  DataTableSkeleton,
} from "@carbon/react";
import {
  DataTableHeader,
  DataTableRow,
  DataTableCell as IDataTableCell,
} from "@/utils/interfaces";
import styles from "@/styles/TestRunsPage.module.css";
import { TableRowProps } from "@carbon/react/lib/components/DataTable/TableRow";
import { TableHeadProps } from "@carbon/react/lib/components/DataTable/TableHead";
import { TableBodyProps } from "@carbon/react/lib/components/DataTable/TableBody";
import StatusIndicator from "../common/StatusIndicator";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorPage from "@/app/error/page";
import { MAX_RECORDS} from "@/utils/constants/common";
import { useTranslations } from "next-intl";
import { InlineNotification } from "@carbon/react";


interface CustomCellProps {
  header: string;
  value: any;
}

/**
 * Transforms and flattens the raw API data for Carbon DataTable.
 * @param runs - The array of run objects from the API.
 * @returns A new array of flat objects, each with a unique `id` and properties matching the headers.
 */
const transformRunsforTable = (runs: Run[]) => {
  if (!runs) {
    return [];
  }

  return runs.map((run) => {
    const structure = run.testStructure || {};

    return {
      id: run.runId,
      submittedAt: structure.queued ? new Date(structure.queued).toLocaleString().replace(',', '') : 'N/A',
      testRunName: structure.runName || 'N/A',
      requestor: structure.requestor || 'N/A',
      group: structure.group || 'N/A',
      bundle: structure.bundle || 'N/A',
      package: structure.testName?.substring(0, structure.testName.lastIndexOf('.')) || 'N/A',
      testName: structure.testShortName || structure.testName || 'N/A',
      tags: structure.tags ? structure.tags.join(', ') : 'N/A',
      status: structure.status || 'N/A',
      result: structure.result || 'N/A',
      submissionId: structure.submissionId || 'N/A',
    };
  });
};

/**
 * This component encapsulates the logic for rendering a cell.
 * It renders a special layout for the 'result' column and a default for all others.
 */
const CustomCell = ({ header, value }: CustomCellProps) => {
  if (header === "result") {
    return (
      <TableCell>
        <StatusIndicator status={value as string} />
      </TableCell>
    );
  }

  return <TableCell>{value}</TableCell>;
};

interface TestRunsTableProps {
  runsList: Run[];
  limitExceeded: boolean;
  visibleColumns: string[];
  orderedHeaders?: { id: string; columnName: string }[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function TestRunsTable({runsList,limitExceeded, visibleColumns, orderedHeaders, isLoading, isError}: TestRunsTableProps) {
  const translations = useTranslations("TestRunsTable");

  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = orderedHeaders?.filter(column => visibleColumns.includes(column.id)).map(column => ({
    key: column.id,
    header: translations(column.id)
  })) || [];

  // Transform the raw runs data into a format suitable for the DataTable
  const tableRows = useMemo(() => transformRunsforTable(runsList), [runsList]);

  // Calculate the paginated rows based on the current page and page size
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return tableRows.slice(startIndex, endIndex);
  }, [tableRows, currentPage, pageSize]);

  // Generate the time frame text based on the runs data
  const timeFrameText = useMemo(() => {
    if (!runsList || runsList.length === 0) {
      return translations("noTestRunsFound");
    }

    let text = translations("timeFrameText.default");
    const dates = runsList.map((run) =>
      new Date(run.testStructure?.queued || 0).getTime(),
    );
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    if (earliestDate && latestDate) {
      text = translations('timeFrameText.range', {
        from: earliestDate.toLocaleString().replace(',', ''),
        to: latestDate.toLocaleString().replace(',', '')
      });
    }
    return text;
  }, [runsList, translations]);

  if (isError) {
    return <ErrorPage />;
  }

  if (isLoading) {
    return (
      <div>
        <p className={styles.timeFrameText}>{translations("isloading")}</p>
        <DataTableSkeleton
          data-testid="loading-table-skeleton"
          columnCount={headers.length}
          rowCount={pageSize}
        />
      </div>
    );
  }

  const handlePaginationChange = ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // Navigate to the test run details page using the runId
  const handleRowClick = (runId: string) => {
    const queryString = searchParams.toString();

    // Save the query string to the sessionStorage if the window object is available
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('testRunsQuery', queryString);
    }

    // Navigate to the test run details page
    router.push(`/test-runs/${runId}`);
  };

  if ( !tableRows || tableRows.length === 0) {
    return <p>{translations('noTestRunsFound')}</p>;
  }

  return (
    <div className={styles.resultsPageContainer}>
      {limitExceeded && <InlineNotification
        className={styles.notification}
        kind="warning" 
        title="Limit Exceeded" 
        subtitle={`Your query returned more than ${MAX_RECORDS} results. Showing the first ${MAX_RECORDS} records.`} 
      />}
      <p className={styles.timeFrameText}>{timeFrameText}</p>
      <div className={styles.testRunsTableContainer}>
        <DataTable isSortable rows={paginatedRows} headers={headers}>
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
            <TableContainer>
              <Table {...getTableProps()} aria-label="test runs results table" size="lg">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} {...getRowProps({ row })} onClick={() => handleRowClick(row.id)}>
                      {row.cells.map((cell) => 
                        <CustomCell key={cell.id} value={cell.value} header={cell.info.header} />)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <Pagination
          backwardText={translations("pagination.backwardText")}
          forwardText={translations("pagination.forwardText")}
          itemsPerPageText={translations("pagination.itemsPerPageText")}
          itemRangeText={(min:number, max:number, total:number) =>`${min}–${max} ${translations("pagination.of")} ${total} ${translations("pagination.items")}`}
          pageRangeText={(current:number, total:number) =>`${translations("pagination.of")} ${total} ${translations("pagination.pages")}`}
          pageNumberText={translations("pagination.pageNumberText")}
          page={currentPage}
          pageSize={pageSize}
          pageSizes={[10, 20, 30, 40, 50]}
          totalItems={tableRows.length}
          onChange={handlePaginationChange}
        />
      </div>
    </div>
  );
}