/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';

function buildMetadataStatusLine(
  imageId: string,
  columns: number,
  rows: number,
  isInbound: boolean | undefined,
  aid: string | undefined
) {
  let inboundOrOutboundText = '';
  let aidKeyText = '';

  inboundOrOutboundText = isInbound ? ' - Inbound' : ' - Outbound';

  if (aid !== undefined) {
    aidKeyText = ' - ' + aid;
  }

  return imageId + ' - ' + columns + 'x' + rows + inboundOrOutboundText + aidKeyText;
}

function createNewRows(metadataStatusLine: string, columns: number) {
  // Determine number of extra rows with a line of padding and wraparound.
  let numberOfNewRows = 2 + Math.floor(metadataStatusLine.length / columns);

  // If it is perfectly divisible, then remove the extra row.
  if (metadataStatusLine.length % columns === 0) {
    numberOfNewRows--;
  }

  const newRows: (TerminalImageCharacter | null)[][] = Array.from({ length: numberOfNewRows }, () =>
    Array(columns).fill(null)
  );

  return newRows;
}

function populateNewRows(
  metadataStatusLine: string,
  newRows: (TerminalImageCharacter | null)[][],
  columns: number
) {
  let charRow = 1;
  let charColumn = 0;

  for (let charIndex = 0; charIndex < metadataStatusLine.length; charIndex++) {
    const statusLineCharacter: TerminalImageCharacter = {
      character: metadataStatusLine.charAt(charIndex),
    };

    newRows[charRow][charColumn] = statusLineCharacter;

    // Increment column number, then check if the text needs to wrap around to the next row.
    charColumn++;
    if (charColumn >= columns) {
      charColumn = 0;
      charRow++;
    }
  }
}

export function appendMetadataStatusLine(
  columns: number,
  rows: number,
  characterArray: (TerminalImageCharacter | null)[][],
  imageId: string,
  isInbound: boolean | undefined,
  aid: string | undefined
) {
  const metadataStatusLine = buildMetadataStatusLine(imageId, columns, rows, isInbound, aid);

  const newRows = createNewRows(metadataStatusLine, columns);

  populateNewRows(metadataStatusLine, newRows, columns);

  characterArray.push(...newRows);
}
