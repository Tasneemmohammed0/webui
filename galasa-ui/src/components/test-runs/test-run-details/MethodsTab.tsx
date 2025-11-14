/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { TestMethod } from '@/generated/galasaapi';
import { getIsoTimeDifference } from '@/utils/timeOperations';
import { DataTableHeader, DataTableRow } from '@/utils/interfaces';
import { DataTable, TableContainer, Table, TableCell, TableHeader } from '@carbon/react';
import TableBody, { TableBodyProps } from '@carbon/react/lib/components/DataTable/TableBody';
import TableHead, { TableHeadProps } from '@carbon/react/lib/components/DataTable/TableHead';
import TableRow, { TableRowProps } from '@carbon/react/lib/components/DataTable/TableRow';
import React, { useEffect, useState } from 'react';
import { TableToolbarContent } from '@carbon/react';
import { TableToolbarSearch } from '@carbon/react';
import StatusIndicator from '../../common/StatusIndicator';
import styles from '@/styles/test-runs/test-run-details/MethodsTab.module.css';
import { useTranslations } from 'next-intl';

export interface MethodDetails {
  id: string;
  methodName: string;
  duration: string;
  status: string;
  result: string;
  runLogStartLine: number;
}

interface MethodsTabProps {
  methods: TestMethod[];
  onMethodClick?: (method: MethodDetails) => void;
}

function MethodsTab({ methods, onMethodClick }: MethodsTabProps) {
  const translations = useTranslations('MethodsTab');

  const [methodDetails, setMethodDetails] = useState<MethodDetails[]>([]);

  const extractMethods = (methods: TestMethod[]) => {
    let methodDetails: MethodDetails[] = [];

    methods.map((method, index) => {
      const methodDetail: MethodDetails = {
        id: index.toString(),
        methodName: method.methodName || '',
        duration: getIsoTimeDifference(method.startTime!, method.endTime!),
        status: method.status || '',
        result: method.result || '',
        runLogStartLine: method.runLogStart || 0,
      };

      methodDetails.push(methodDetail);
    });

    setMethodDetails(methodDetails);
  };

  const headers = [
    // headers we want to show in the data table
    // keys should match with the prop name in the interface
    {
      key: 'methodName',
      header: translations('table.methodName'),
    },
    {
      key: 'status',
      header: translations('table.status'),
    },
    {
      key: 'result',
      header: translations('table.result'),
    },
    {
      key: 'duration',
      header: translations('table.duration'),
    },
  ];

  useEffect(() => {
    extractMethods(methods);
  }, [methods]);

  return (
    <>
      <div className={styles.titleContainer}>
        <h3>{translations('title')}</h3>
        <p>{translations('subtitle')}</p>
      </div>
      <DataTable isSortable rows={methodDetails} headers={headers}>
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
          onInputChange,
        }: {
          rows: DataTableRow[];
          headers: DataTableHeader[];
          getHeaderProps: (options: any) => TableHeadProps;
          getRowProps: (options: any) => TableRowProps;
          getTableProps: () => TableBodyProps;
          onInputChange: (evt: React.ChangeEvent<HTMLImageElement>) => void;
        }) => (
          <TableContainer>
            <TableToolbarContent>
              <TableToolbarSearch
                placeholder={translations('search_placeholder')}
                persistent
                onChange={onInputChange}
              />
            </TableToolbarContent>
            <Table {...getTableProps()} aria-label="runs table" size="lg">
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
                {rows.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() =>
                        onMethodClick && onMethodClick(methodDetails[parseInt(row.id)])
                      }
                      className={styles.clickableRow}
                      {...getRowProps({ row })}
                    >
                      {/* Method name */}
                      <TableCell key={row.cells[0].id}>
                        <p>{row.cells[0].value}</p>
                      </TableCell>
                      {/* Status */}
                      <TableCell key={row.cells[1].id}>
                        <p style={{ textTransform: 'capitalize' }}>{row.cells[1].value}</p>
                      </TableCell>
                      {/* Result */}
                      <TableCell key={row.cells[2].id}>
                        <StatusIndicator status={row.cells[2].value} />
                      </TableCell>
                      {/* Elapsed Time */}
                      <TableCell key={row.cells[3].id}>
                        <p>{row.cells[3].value}</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </>
  );
}

export default MethodsTab;
