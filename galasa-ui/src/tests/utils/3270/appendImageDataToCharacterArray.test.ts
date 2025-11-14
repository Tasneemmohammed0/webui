/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { appendImageDataToCharacterArray } from '@/utils/3270/appendImageDataToCharacterArray';
import { TerminalImage, TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

describe('appendImageDataToCharacterArray', () => {
  let testData: TerminalImage;
  let characterArray: (TerminalImageCharacter | null)[][];
  const rows = 3;
  const columns = 5;

  beforeEach(() => {
    testData = {
      id: 'testId',
      imageSize: { rows: rows, columns: columns },
      fields: [],
    };

    characterArray = Array.from({ length: rows }, () => Array(columns).fill(null));
  });

  test('should return correct 2D array for valid input', () => {
    testData.fields.push(
      {
        row: 0,
        column: 0,
        contents: [{ text: 'AB' }],
      },
      {
        row: 1,
        column: 0,
        contents: [{ characters: ['C', 'D'] }],
      }
    );

    const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
      Array(columns).fill(null)
    );

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
      [{ character: 'A' }, { character: 'B' }, null, null, null],
      [{ character: 'C' }, { character: 'D' }, null, null, null],
      [null, null, null, null, null],
    ];

    appendImageDataToCharacterArray(testData, rows, columns, characterArray);

    expect(characterArray).toEqual(expectedOutput);
  });

  test('should ignore empty contents field', () => {
    testData.fields.push({
      row: 0,
      column: 2,
      contents: [],
    });

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];

    appendImageDataToCharacterArray(testData, rows, columns, characterArray);

    expect(characterArray).toEqual(expectedOutput);
  });

  test('should correctly manage wraparound when text is longer than number of columns left in row', () => {
    testData.fields.push({
      row: 1,
      column: 4,
      contents: [{ text: 'XX' }],
    });

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
      [null, null, null, null, null],
      [null, null, null, null, { character: 'X' }],
      [{ character: 'X' }, null, null, null, null],
    ];

    appendImageDataToCharacterArray(testData, rows, columns, characterArray);

    expect(characterArray).toEqual(expectedOutput);
  });

  test('should throw an error for invalid image data overlap', () => {
    testData.fields.push({
      row: 1,
      column: 4,
      contents: [{ text: 'X' }],
    });
    testData.fields.push({
      row: 1,
      column: 4,
      contents: [{ text: 'X' }],
    });

    expect(() => appendImageDataToCharacterArray(testData, rows, columns, characterArray)).toThrow(
      'Invalid image data - image data overlapping'
    );
  });

  test('should throw an error for out-of-bounds placement', () => {
    testData.fields.push({
      row: 2,
      column: 4,
      contents: [{ text: 'XX' }],
    });

    expect(() => appendImageDataToCharacterArray(testData, rows, columns, characterArray)).toThrow(
      'Invalid image data - image data out of bounds'
    );
  });
});
