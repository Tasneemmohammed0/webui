/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { describe, expect, test } from '@jest/globals';
import { appendCursor } from '@/utils/3270/appendCursor';
import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

describe('appendCursor', () => {
  test('should not modify the array when cursorRow or cursorColumn are undefined', () => {
    const rows = 5;
    const columns = 4;
    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );

    appendCursor(undefined, undefined, rows, columns, characterArray);

    expect(characterArray).toEqual(Array.from({ length: rows }, () => Array(columns).fill(null)));
  });

  test('should set cursor property to true for existing character at (cursorRow, cursorColumn)', () => {
    const rows = 5;
    const columns = 4;
    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );
    const cursorRow = 2;
    const cursorColumn = 1;

    const initialChar = { character: 'A' };
    characterArray[cursorRow][cursorColumn] = initialChar;

    appendCursor(cursorRow, cursorColumn, rows, columns, characterArray);

    expect(characterArray[cursorRow][cursorColumn]).toEqual(
      expect.objectContaining({ cursor: true })
    );
  });

  test('should create a new character with cursor: true at (cursorRow, cursorColumn) when no character exists', () => {
    const rows = 5;
    const columns = 4;
    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );
    const cursorRow = 2;
    const cursorColumn = 1;

    appendCursor(cursorRow, cursorColumn, rows, columns, characterArray);

    expect(characterArray[cursorRow][cursorColumn]).toEqual(
      expect.objectContaining({ character: '', cursor: true })
    );
  });

  test('should not modify the array when cursorRow or cursorColumn are out of bounds', () => {
    const rows = 5;
    const columns = 4;
    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );
    const cursorRow = 10;
    const cursorColumn = 1;

    appendCursor(cursorRow, cursorColumn, rows, columns, characterArray);

    expect(characterArray).toEqual(Array.from({ length: rows }, () => Array(columns).fill(null)));
  });

  test('should not modify the array when cursorRow or cursorColumn are negative', () => {
    const rows = 5;
    const columns = 4;
    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );
    const cursorRow = -1;
    const cursorColumn = 1;

    appendCursor(cursorRow, cursorColumn, rows, columns, characterArray);

    expect(characterArray).toEqual(Array.from({ length: rows }, () => Array(columns).fill(null)));
  });
});
