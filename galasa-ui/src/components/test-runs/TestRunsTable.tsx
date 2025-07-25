/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
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
  ColumnDefinition,
  DataTableHeader,
  DataTableRow,
  DataTableCell as IDataTableCell,
  runStructure,
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
import useHistoryBreadCrumbs from "@/hooks/useHistoryBreadCrumbs";
import { TEST_RUNS } from "@/utils/constants/breadcrumb";
import { useDateTimeFormat } from "@/contexts/DateTimeFormatContext";


interface CustomCellProps {
  header: string;
  value: any;
}

interface TestRunsTableProps {
  runsList: runStructure[];
  limitExceeded: boolean;
  visibleColumns: string[];
  orderedHeaders?: ColumnDefinition[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function TestRunsTable({runsList,limitExceeded, visibleColumns, orderedHeaders, isLoading, isError}: TestRunsTableProps) {
  const translations = useTranslations("TestRunsTable");
  const { pushBreadCrumb } = useHistoryBreadCrumbs();
  const { formatDate } = useDateTimeFormat();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = orderedHeaders?.filter(column => visibleColumns.includes(column.id)).map(column => ({
    key: column.id,
    header: translations(column.id)
  })) || [];

  // Calculate the paginated rows based on the current page and page size
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return runsList.slice(startIndex, endIndex);
  }, [runsList, currentPage, pageSize]);

  // Generate the time frame text based on the runs data
  const timeFrameText = useMemo(() => {
    if (!runsList || runsList.length === 0) {
      return translations("noTestRunsFound");
    }
      
    let text = translations("timeFrameText.default");

    // Filter out any runs that don't have a valid `submittedAt` date
    const runsWithDates = runsList.filter(run => run.submittedAt);
  
    if (runsWithDates.length !== 0) {
      const dates = runsWithDates.map((run) =>
        new Date(run.submittedAt).getTime(),
      );
      const earliestDate = new Date(Math.min(...dates));
      const latestDate = new Date(Math.max(...dates));

      if (earliestDate && latestDate) {
        text = translations('timeFrameText.range', {
          from: formatDate(earliestDate),
          to: formatDate(latestDate)
        });
      }
    }
    return text;
  }, [runsList, translations, formatDate]);

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
  const handleRowClick = (runId: string, runName: string) => {
    // Push the current page URL to the breadcrumb history
    pushBreadCrumb({
      ...TEST_RUNS , route: `/test-runs?${searchParams.toString()}`
    });

    // Navigate to the test run details page
    router.push(`/test-runs/${runId}`);
  };

  /**
 * This component encapsulates the logic for rendering a cell.
 * It renders a special layout for the 'result' column and a default for all others.
 */
  const CustomCell = ({ header, value }: CustomCellProps) => {
    let cellComponent =  <TableCell>{value}</TableCell>;

    if (value === 'N/A' || !value) {
      return <TableCell>N/A</TableCell>;
    }

    if (header === "result") {
      cellComponent = (
        <TableCell>
          <StatusIndicator status={value as string} />
        </TableCell>
      );
    } else if (header === "submittedAt") {
      // Format the date using the context's formatDate function
      cellComponent = <TableCell>{formatDate(new Date(value))}</TableCell>;
    }

    return cellComponent;
  };

  if (visibleColumns.length === 0) {
    return <p>{translations('noColumnsSelected')}</p>;
  }

  if ( !runsList || runsList.length === 0) {
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
        <DataTable rows={paginatedRows} headers={headers}>
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
                    <TableRow key={row.id} {...getRowProps({ row })} onClick={() => handleRowClick(row.id, row.cells.find(cell => cell.info.header === 'testRunName')?.value as string)}>
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
          totalItems={runsList.length}
          onChange={handlePaginationChange}
        />
      </div>
    </div>
  );
}