/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import getArrayOfImageCharacters from '@/utils/3270/getArrayOfImageCharacters';
import { TerminalImage, TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

describe('getArrayOfImageCharacters', () => {
  let testData: TerminalImage;

  beforeEach(() => {
    testData = {
      id: 'testId',
      imageSize: { rows: 3, columns: 13 },
      fields: [],
    };
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

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
      [
        { character: 'A' },
        { character: 'B' },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      [
        { character: 'C' },
        { character: 'D' },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
      [
        { character: 't' },
        { character: 'e' },
        { character: 's' },
        { character: 't' },
        { character: 'I' },
        { character: 'd' },
        { character: ' ' },
        { character: '-' },
        { character: ' ' },
        { character: '1' },
        { character: '3' },
        { character: 'x' },
        { character: '3' },
      ],
      [
        { character: ' ' },
        { character: '-' },
        { character: ' ' },
        { character: 'O' },
        { character: 'u' },
        { character: 't' },
        { character: 'b' },
        { character: 'o' },
        { character: 'u' },
        { character: 'n' },
        { character: 'd' },
        null,
        null,
      ],
    ];

    expect(getArrayOfImageCharacters(testData)).toEqual(expectedOutput);
  });
});
