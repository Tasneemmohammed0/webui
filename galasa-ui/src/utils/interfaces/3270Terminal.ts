/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
export interface CellFor3270 {
  id: string;
  Terminal: string;
  screenNumber: number;
}

interface Terminal {
  id: string;
  runId: string;
  sequence: number;
  images: TerminalImage[];
  defaultSize: TerminalSize;
}

export interface TerminalImage {
  id: string;
  sequence?: number;
  inbound?: boolean;
  type?: string;
  imageSize: TerminalSize;
  cursorRow?: number;
  cursorColumn?: number;
  aid?: string;
  fields: TerminalImageField[];
}

interface TerminalImageFieldDetails {
  unformatted?: boolean;
  fieldProtected?: boolean;
  fieldNumeric?: boolean;
  fieldDisplay?: boolean;
  fieldIntenseDisplay?: boolean;
  fieldSelectorPen?: boolean;
  fieldModified?: boolean;
  foregroundColor?: string;
  backgroundColor?: string;
  highlight?: string;
}

export interface TerminalImageField extends TerminalImageFieldDetails {
  row: number;
  column: number;
  contents: FieldContents[];
}

export interface TerminalImageCharacter extends TerminalImageFieldDetails {
  character: string;
  cursor?: boolean;
}

export interface FieldContents {
  characters?: string[];
  text?: string;
}

export interface TerminalSize {
  rows: number;
  columns: number;
}

export interface DropdownOption {
  id: string;
  label: string;
}
