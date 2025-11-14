/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { TerminalImage, TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';
import { appendImageDataToCharacterArray } from '@/utils/3270/appendImageDataToCharacterArray';
import { appendMetadataStatusLine } from '@/utils/3270/appendMetadataStatusLine';
import { appendCursor } from '@/utils/3270/appendCursor';

// Return a 2D array of characters, with each character representing all properties of its parent TerminalImageField.
export default function getArrayOfImageCharacters(
  imageData: TerminalImage
): (TerminalImageCharacter | null)[][] {
  const rows = imageData.imageSize.rows;
  const columns = imageData.imageSize.columns;

  // Initialise array with nulls.
  const characterArray: (TerminalImageCharacter | null)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(null)
  );

  appendImageDataToCharacterArray(imageData, rows, columns, characterArray);

  appendMetadataStatusLine(
    columns,
    rows,
    characterArray,
    imageData.id,
    imageData.inbound,
    imageData.aid
  );

  appendCursor(imageData.cursorRow, imageData.cursorColumn, rows, columns, characterArray);

  return characterArray;
}
