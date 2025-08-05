/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Common interfaces used across multiple components and utilities
 */

export interface MarkdownResponse {
  markdownContent: string;
  responseStatusCode: number;
}

// DataTableHeader, DataTableCell, DataTableRow are IBM Carbon interfaces
export interface DataTableHeader {
  key: string;
  header: string;
}

export interface DataTableCell {
  id: string;
  value: string;
  isEditable: boolean;
  isEditing: boolean;
  isValid: boolean;
  errors: null | Array<any>;
  info: {
    header: string;
  };
}

export interface DataTableRow {
  id: string;
  cells: DataTableCell[];
  disabled?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface runStructure {
  id: string;
  submittedAt: string;
  runName: string;
  requestor: string;
  group: string;
  bundle: string;
  package: string;
  testShortName: string;
  testName: string;
  tags:  string;
  status: string;
  result: string;
  submissionId: string;
}

export interface DataPoint {
  group: string;
  date: string; // ISO timestamp
  value: number;
  custom: {
    id: string;
    submittedAt: string;
    runName: string;
    requestor: string;
    group: string;
    bundle: string;
    package: string;
    testName: string;
    tags: string;
    status: string;
    result: string;
    submissionId: string;
  };
};


export interface ColumnDefinition {
  id: keyof runStructure; 
  columnName: string;
}
