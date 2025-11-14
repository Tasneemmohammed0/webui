/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

export function appendCursor(
  cursorRow: number | undefined,
  cursorColumn: number | undefined,
  rows: number,
  columns: number,
  characterArray: (TerminalImageCharacter | null)[][]
) {
  if (cursorRow && cursorColumn) {
    if (cursorRow < rows && cursorRow >= 0 && cursorColumn < columns && cursorColumn >= 0) {
      if (characterArray[cursorRow][cursorColumn]) {
        characterArray[cursorRow][cursorColumn].cursor = true;
      } else {
        characterArray[cursorRow][cursorColumn] = { character: '', cursor: true };
      }
    }
  }
}
