/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { downloadArtifactFromServer } from '@/actions/runsAction';
import { FileNode, TreeNodeData } from '@/utils/functions/artifacts';
import { CellFor3270, TerminalImage, TerminalImageField } from '@/utils/interfaces/3270Terminal';
import pako from 'pako';

export const newFlattenedZos3270TerminalData: CellFor3270[] = [];
export const newAllImageData: TerminalImage[] = [];
let previousRunId: string = '';

// Expected input: "Terminal1-1" which would mean the terminal name is "Terminal1" and we're looking at screen number 1.
export function splitScreenAndTerminal(terminalNameAndScreenNumberSeparatedByDash: string) {
  const parts = terminalNameAndScreenNumberSeparatedByDash.split('-');

  // Ensure there is a dash, and that the last element is an integer.
  if (parts.length < 2 || !Number.isInteger(parseInt(parts[parts.length - 1]))) {
    throw new Error('Invalid terminal ID or screen number');
  }

  const screenNumber = parseInt(parts[parts.length - 1], 10);

  // Rejoin all parts up to the last one, in case the terminal name has a '-' in it.
  const terminalName = parts.slice(0, -1).join('-');

  return {
    screenNumber,
    terminalName,
  };
}

function unzipBase64(artifactData: {
  contentType: string;
  data: string;
  size: number;
  base64: string;
}) {
  // 1. Convert the base64 string to a Uint8Array.
  const gzippedBinaryString = atob(artifactData.base64);

  const gzippedUint8Array = new Uint8Array(gzippedBinaryString.length);

  for (let i = 0; i < gzippedBinaryString.length; i++) {
    gzippedUint8Array[i] = gzippedBinaryString.charCodeAt(i);
  }

  // 2. Decompress the Uint8Array using pako.
  const decompressedUint8Array = pako.inflate(gzippedUint8Array);

  // 3. Convert the decompressed Uint8Array back to a string.
  return JSON.parse(new TextDecoder().decode(decompressedUint8Array));
}

export function populateFlattenedZos3270TerminalDataAndAllImageData(images: TerminalImage[]): void {
  images.forEach((image) => {
    if (!image.id || !image.fields || !image.imageSize) {
      throw new Error('Invalid image data');
    }

    // Populate terminal data for screenshot table.
    const id = image.id;
    const result = splitScreenAndTerminal(id);

    newFlattenedZos3270TerminalData.push({
      id: id,
      Terminal: result.terminalName,
      screenNumber: result.screenNumber,
    });

    // Populate all image data for screenshot rendering.
    const imageFields: TerminalImageField[] = image.fields
      // Filter out any image fields that are missing a row or column.
      .filter(
        (imageField: TerminalImageField) => imageField.row != null && imageField.column != null
      )
      .map((imageField: TerminalImageField) => ({
        row: imageField.row,
        column: imageField.column,
        contents: imageField.contents,
        unformatted: imageField.unformatted,
        fieldProtected: imageField.fieldProtected,
        fieldNumeric: imageField.fieldNumeric,
        fieldDisplay: imageField.fieldDisplay,
        fieldIntenseDisplay: imageField.fieldIntenseDisplay,
        fieldSelectorPen: imageField.fieldSelectorPen,
        fieldModified: imageField.fieldModified,
        foregroundColor: imageField.foregroundColor,
        backgroundColor: imageField.backgroundColor,
        highlight: imageField.highlight,
      }));

    newAllImageData.push({
      id: image.id,
      sequence: image.sequence,
      inbound: image.inbound,
      type: image.type,
      imageSize: image.imageSize,
      cursorRow: image.cursorRow,
      cursorColumn: image.cursorColumn,
      aid: image.aid,
      fields: imageFields,
    });
  });
}

export const get3270Screenshots = async (zos3270TerminalData: TreeNodeData[], runId: string) => {
  // Test if user is requesting same resource as the previously fetched one, if so then simply return existing value.
  if (
    newAllImageData.length === 0 ||
    newFlattenedZos3270TerminalData.length === 0 ||
    previousRunId !== runId
  ) {
    newAllImageData.length = 0;
    newFlattenedZos3270TerminalData.length = 0;

    for (var terminal of zos3270TerminalData) {
      const zippedFilesContainingImageJSON: FileNode[] = Object.values(terminal.children)
        .map((node) => node as FileNode)
        .filter((node) => node.isFile);

      for (var file of zippedFilesContainingImageJSON) {
        await downloadArtifactFromServer(runId, file.url).then((artifactData) => {
          // Unzip the content
          const images: TerminalImage[] = unzipBase64(artifactData).images;

          populateFlattenedZos3270TerminalDataAndAllImageData(images);
        });
      }
    }

    // Sort terminal data according to terminal name descending, then screen number descending.
    newFlattenedZos3270TerminalData.sort(function (a, b) {
      if (a.Terminal === b.Terminal) {
        return a.screenNumber - b.screenNumber;
      }
      return a.Terminal > b.Terminal ? 1 : -1;
    });
  }
  previousRunId = runId;

  return { newFlattenedZos3270TerminalData, newAllImageData };
};
