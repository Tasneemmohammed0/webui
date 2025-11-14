/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import {
  populateFlattenedZos3270TerminalDataAndAllImageData,
  splitScreenAndTerminal,
  newFlattenedZos3270TerminalData,
  newAllImageData,
} from '@/utils/3270/get3270Screenshots';
import { CellFor3270, TerminalImage } from '@/utils/interfaces/3270Terminal';

describe('splitScreenAndTerminal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test split when input has no dashes', () => {
    expect(() => {
      splitScreenAndTerminal('term1');
    }).toThrow('Invalid terminal ID or screen number');
  });

  test('test split when input has only one dash', () => {
    expect(() => {
      splitScreenAndTerminal('-');
    }).toThrow('Invalid terminal ID or screen number');
  });

  test('test split when input has a terminal name with dash without terminal number', () => {
    expect(() => {
      splitScreenAndTerminal('term1-');
    }).toThrow('Invalid terminal ID or screen number');
  });

  test('test split with invalid screen number', () => {
    expect(() => {
      splitScreenAndTerminal('term1-a');
    }).toThrow('Invalid terminal ID or screen number');
  });

  test('test split when input has only one dash with terminal number', () => {
    expect(splitScreenAndTerminal('--2')).toEqual({ screenNumber: 2, terminalName: '-' });
  });

  test('test split with correct input with 1 dash', () => {
    expect(splitScreenAndTerminal('term1-1')).toEqual({ screenNumber: 1, terminalName: 'term1' });
  });

  test('test split with correct input with more than 1 dash', () => {
    expect(splitScreenAndTerminal('term1-is-the-best-1')).toEqual({
      screenNumber: 1,
      terminalName: 'term1-is-the-best',
    });
  });

  test('test split with correct input with more than 1 dash in odd placement', () => {
    expect(splitScreenAndTerminal('term1--1')).toEqual({ screenNumber: 1, terminalName: 'term1-' });
  });
});

describe('populateFlattenedZos3270TerminalDataAndAllImageData', () => {
  // Example given is only a single image.
  const mockImages: TerminalImage[] = [
    {
      sequence: 101,
      id: 'IYK2ZNB5_1-101',
      imageSize: { columns: 80, rows: 24 },
      cursorColumn: 25,
      cursorRow: 1,
      aid: 'PF9',
      fields: [
        {
          row: 0,
          column: 0,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [
            {
              text: ' INQUIRE PROGRAM(NONEX)                                                       ',
            },
          ],
        },
        {
          row: 0,
          column: 79,
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [{ text: ' ' }],
        },
        {
          row: 1,
          column: 1,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: 'STATUS: ' }],
        },
        {
          row: 1,
          column: 10,
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [
            {
              text: 'RESULTS - OVERTYPE TO MODIFY                                         ',
            },
          ],
        },
        {
          row: 2,
          column: 0,
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [{ text: ' ' }],
        },
        {
          row: 2,
          column: 2,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: 'Prog(NONEX   )' }],
        },
        {
          row: 2,
          column: 17,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '                ' }],
        },
        {
          row: 2,
          column: 34,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 38,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 42,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 46,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 50,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 54,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 58,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: '   ' }],
        },
        {
          row: 2,
          column: 62,
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [
            {
              text: 'NOT FOUND                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             ',
            },
          ],
        },
        {
          row: 21,
          column: 53,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: 'SYSID=CICS' }],
        },
        {
          row: 21,
          column: 64,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: 'APPLID=IYK2ZNB5  ' }],
        },
        {
          row: 22,
          column: 2,
          fieldProtected: true,
          fieldDisplay: true,
          contents: [{ text: 'RESPONSE:' }],
        },
        {
          row: 22,
          column: 12,
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
          contents: [{ text: '1 ERROR                            ' }],
        },
      ],
    },
  ];

  const mockCorrectFlattenedZos3270TerminalData: CellFor3270[] = [
    { id: 'IYK2ZNB5_1-101', Terminal: 'IYK2ZNB5_1', screenNumber: 101 },
  ];

  const mockCorrectAllImageData: TerminalImage[] = [
    {
      id: 'IYK2ZNB5_1-101',
      sequence: 101,
      imageSize: { columns: 80, rows: 24 },
      cursorRow: 1,
      cursorColumn: 25,
      aid: 'PF9',
      fields: [
        {
          row: 0,
          column: 0,
          contents: [
            {
              text: ' INQUIRE PROGRAM(NONEX)                                                       ',
            },
          ],
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
        {
          row: 0,
          column: 79,
          contents: [{ text: ' ' }],
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
        {
          row: 1,
          column: 1,
          contents: [{ text: 'STATUS: ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 1,
          column: 10,
          contents: [
            { text: 'RESULTS - OVERTYPE TO MODIFY                                         ' },
          ],
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
        {
          row: 2,
          column: 0,
          contents: [{ text: ' ' }],
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
        {
          row: 2,
          column: 2,
          contents: [{ text: 'Prog(NONEX   )' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 17,
          contents: [{ text: '                ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 34,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 38,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 42,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 46,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 50,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 54,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 58,
          contents: [{ text: '   ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 2,
          column: 62,
          contents: [
            {
              text: 'NOT FOUND                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             ',
            },
          ],
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
        {
          row: 21,
          column: 53,
          contents: [{ text: 'SYSID=CICS' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 21,
          column: 64,
          contents: [{ text: 'APPLID=IYK2ZNB5  ' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 22,
          column: 2,
          contents: [{ text: 'RESPONSE:' }],
          fieldProtected: true,
          fieldDisplay: true,
        },
        {
          row: 22,
          column: 12,
          contents: [{ text: '1 ERROR                            ' }],
          fieldProtected: true,
          fieldIntenseDisplay: true,
          fieldSelectorPen: true,
        },
      ],
    },
  ];

  beforeEach(() => {
    newFlattenedZos3270TerminalData.length = 0;
    newAllImageData.length = 0;
  });

  test('should error when tackling images with an empty fields array', () => {
    // Act
    const emptyFieldsImage: any = [
      {
        id: 'image-4',
        fields: [],
        imageSize: { columns: 80, rows: 24 },
      },
    ];

    populateFlattenedZos3270TerminalDataAndAllImageData(emptyFieldsImage);

    // Assert

    // The function should still push a valid object with an empty imageFields array.
    expect(newAllImageData).toEqual([
      {
        id: 'image-4',
        imageSize: { columns: 80, rows: 24 },
        fields: [],
      },
    ] as TerminalImage[]);

    // The terminal data should also be populated correctly.
    expect(newFlattenedZos3270TerminalData).toEqual([
      {
        id: 'image-4',
        Terminal: 'image',
        screenNumber: 4,
      },
    ] as CellFor3270[]);
  });

  test('should filter out empty/ null row and column fields within image fields', () => {
    // Act
    const mockImagesWithoutRowAndColumn: any[] = [
      // Cannot be strongly typed as row and column fields are not allowed to be null/ not there.
      {
        sequence: 1,
        id: 'Terminal_Test-1',
        imageSize: { columns: 80, rows: 24 },
        cursorColumn: 25,
        cursorRow: 1,
        aid: 'PF9',
        fields: [
          {
            row: null,
            fieldIntenseDisplay: true,
            fieldSelectorPen: true,
            contents: [{ text: 'TEST TEXT 1' }],
          },
          {
            row: 0,
            column: 79,
            fieldProtected: true,
            fieldIntenseDisplay: true,
            fieldSelectorPen: true,
            contents: [{ text: 'TEST TEXT 2' }],
          },
        ],
      },
    ];

    populateFlattenedZos3270TerminalDataAndAllImageData(mockImagesWithoutRowAndColumn);

    // Assert
    expect(newAllImageData).toEqual([
      {
        id: 'Terminal_Test-1',
        sequence: 1,
        imageSize: { columns: 80, rows: 24 },
        cursorRow: 1,
        cursorColumn: 25,
        aid: 'PF9',
        fields: [
          {
            row: 0,
            column: 79,
            contents: [{ text: 'TEST TEXT 2' }],
            fieldProtected: true,
            fieldIntenseDisplay: true,
            fieldSelectorPen: true,
          },
        ],
      },
    ] as TerminalImage[]);
  });

  test('correctly populates flattenedZos3270TerminalData and allImageData', () => {
    // Act
    populateFlattenedZos3270TerminalDataAndAllImageData(mockImages);

    // Assert
    expect(newFlattenedZos3270TerminalData).toEqual(mockCorrectFlattenedZos3270TerminalData);
    expect(newAllImageData).toEqual(mockCorrectAllImageData);
  });
});
