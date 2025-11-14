/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { appendMetadataStatusLine } from '@/utils/3270/appendMetadataStatusLine';
import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

describe('appendMetadataStatusLine', () => {
  const imageDataId = 'testId';

  test('status line appended normally', () => {
    const exampleCharacterArray: (TerminalImageCharacter | null)[][] = [
      [
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
        null,
        null,
      ],
    ];

    const inbound = undefined;
    const aid = undefined;

    appendMetadataStatusLine(
      exampleCharacterArray[0].length,
      exampleCharacterArray.length,
      exampleCharacterArray,
      imageDataId,
      inbound,
      aid
    );

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
      [
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
        null,
        null,
      ],
      [
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
        null,
        null,
      ],
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
        { character: '2' },
        { character: '4' },
        { character: 'x' },
        { character: '1' },
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
      ],
    ];

    expect(exampleCharacterArray).toEqual(expectedOutput);
  });

  test('status line wraparound', () => {
    const exampleCharacterArray: (TerminalImageCharacter | null)[][] = [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ];

    const inbound = undefined;
    const aid = undefined;

    appendMetadataStatusLine(
      exampleCharacterArray[0].length,
      exampleCharacterArray.length,
      exampleCharacterArray,
      imageDataId,
      inbound,
      aid
    );

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
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
        { character: '1' },
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

    expect(exampleCharacterArray).toEqual(expectedOutput);
  });

  test('status line inbound with aid', () => {
    const exampleCharacterArray: (TerminalImageCharacter | null)[][] = [
      [null, null, null, null, null, null, null, null, null, null, null, null, null],
    ];

    const inbound = true;
    const aid = 'AID Test';

    appendMetadataStatusLine(
      exampleCharacterArray[0].length,
      exampleCharacterArray.length,
      exampleCharacterArray,
      imageDataId,
      inbound,
      aid
    );

    const expectedOutput: (TerminalImageCharacter | null)[][] = [
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
        { character: '1' },
      ],
      [
        { character: ' ' },
        { character: '-' },
        { character: ' ' },
        { character: 'I' },
        { character: 'n' },
        { character: 'b' },
        { character: 'o' },
        { character: 'u' },
        { character: 'n' },
        { character: 'd' },
        { character: ' ' },
        { character: '-' },
        { character: ' ' },
      ],
      [
        { character: 'A' },
        { character: 'I' },
        { character: 'D' },
        { character: ' ' },
        { character: 'T' },
        { character: 'e' },
        { character: 's' },
        { character: 't' },
        null,
        null,
        null,
        null,
        null,
      ],
    ];

    expect(exampleCharacterArray).toEqual(expectedOutput);
  });
});
