/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';
import {
  cellHeight,
  horizontalCharacterPadding,
  imagePadding,
  font,
  backgroundColour,
  characterColour,
} from '@/utils/constants/screenshotRenderer';

function getRowsAndColumnsFromGridData(gridData: (TerminalImageCharacter | null)[][]) {
  let rows = 0;
  let columns = 0;

  if (gridData && gridData.length > 0) {
    rows = gridData.length;
    columns = gridData[0].length;
  }

  return [rows, columns];
}

function setupCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  rows: number,
  columns: number
): number {
  context.font = font;
  const characterWidth = context.measureText('W').width;

  const rowWidth = (characterWidth + horizontalCharacterPadding) * columns;

  canvas.width = rowWidth + imagePadding;
  canvas.height = rows * cellHeight + imagePadding;

  // Set image background colour to black.
  context.fillStyle = backgroundColour;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = font;
  context.textBaseline = 'middle';
  context.fillStyle = characterColour; // Character colour
  context.lineWidth = 1.5;

  return characterWidth;
}

function drawCharacters(
  gridData: (TerminalImageCharacter | null)[][],
  context: CanvasRenderingContext2D,
  characterWidth: number
) {
  let y = imagePadding / 2 + cellHeight / 2;
  gridData.forEach((row) => {
    // Starting x position.
    let x = imagePadding / 2;

    // Edit context if character cell found.
    row.forEach((characterCell) => {
      if (characterCell) {
        if (characterCell.cursor) {
          // Invert background and foreground
          context.fillStyle = characterColour;
          context.fillRect(x, y - cellHeight / 2, characterWidth, cellHeight);
          context.fillStyle = backgroundColour;
          context.fillText(characterCell.character, x, y);
          context.fillStyle = characterColour;
        } else {
          context.fillText(characterCell.character, x, y);
        }

        // TODO: Extra image fields to be handled here, such as background colour.
      }
      x += characterWidth + horizontalCharacterPadding;
    });
    // Move to the next row.
    y += cellHeight;
  });
}

export const screenshotRenderer = (
  canvas: HTMLCanvasElement,
  gridData: (TerminalImageCharacter | null)[][],
  context: CanvasRenderingContext2D
): void => {
  const [rows, columns] = getRowsAndColumnsFromGridData(gridData);

  // Steup canvas and set character width.
  const characterWidth = setupCanvas(context, canvas, rows, columns);

  // Draw the characters.
  drawCharacters(gridData, context, characterWidth);
};
