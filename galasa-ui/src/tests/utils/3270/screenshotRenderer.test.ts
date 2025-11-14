/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { screenshotRenderer } from '@/utils/3270/screenshotRenderer';
import { TerminalImageCharacter } from '@/utils/interfaces/3270Terminal';
import {
  cellHeight,
  horizontalCharacterPadding,
  imagePadding,
  backgroundColour,
  characterColour,
} from '@/utils/constants/screenshotRenderer';
import 'jest-canvas-mock';

describe('screenshotRenderer', () => {
  let mockCanvas: HTMLCanvasElement | null;
  let context: CanvasRenderingContext2D | null;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    if (!mockCanvas) throw new Error('No canvas');
    context = mockCanvas.getContext('2d');
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders null grid data correctly', async () => {
    if (!mockCanvas || !context) throw new Error('No canvas or context');

    const gridData: (TerminalImageCharacter | null)[][] = Array(24)
      .fill(null)
      .map(() => Array(80).fill(null));

    screenshotRenderer(mockCanvas, gridData, context);

    const rows = gridData.length;
    const columns = gridData[0].length;
    const characterWidth = context.measureText('W').width;
    const rowWidth = (characterWidth + horizontalCharacterPadding) * columns;

    const width = rowWidth + imagePadding;
    const height = rows * cellHeight + imagePadding;

    // Assertions
    expect(mockCanvas.getContext('2d')).toBeDefined();
    expect(mockCanvas.width).toBe(width);
    expect(mockCanvas.height).toBe(height);
    expect(context.fillStyle).toBe(characterColour);
    expect(context.fillText).toHaveBeenCalledTimes(0);
  });

  test('renders null grid data correctly', async () => {
    if (!mockCanvas || !context) throw new Error('No canvas or context');

    const gridData: (TerminalImageCharacter | null)[][] = Array(24)
      .fill(null)
      .map(() => Array(80).fill(null));

    screenshotRenderer(mockCanvas, gridData, context);
  });

  test('handles small grid data', async () => {
    if (!mockCanvas || !context) throw new Error('No canvas or context');

    const gridData: (TerminalImageCharacter | null)[][] = [
      [{ character: 'A' }, { character: 'B' }, null, null, null],
      [{ character: 'C' }, { character: 'D' }, null, null, null],
      [null, null, null, null, null],
    ];

    const fillTextSpy = jest.spyOn(context, 'fillText');

    screenshotRenderer(mockCanvas, gridData, context);

    const firstXCoordinate = imagePadding / 2;
    const secondXCoordinate =
      firstXCoordinate + (context.measureText('W').width + horizontalCharacterPadding);
    const firstYCoordinate = imagePadding / 2 + cellHeight / 2;
    const secondYCoordinate = firstYCoordinate + cellHeight;

    expect(fillTextSpy).toHaveBeenCalledWith('A', firstXCoordinate, firstYCoordinate);
    expect(fillTextSpy).toHaveBeenCalledWith('B', secondXCoordinate, firstYCoordinate);
    expect(fillTextSpy).toHaveBeenCalledWith('C', firstXCoordinate, secondYCoordinate);
    expect(fillTextSpy).toHaveBeenCalledWith('D', secondXCoordinate, secondYCoordinate);
  });

  test('handles empty gridData', async () => {
    if (!mockCanvas || !context) throw new Error('No canvas or context');

    const gridData: (TerminalImageCharacter | null)[][] = [];

    screenshotRenderer(mockCanvas, gridData, context);

    // Assertions
    expect(mockCanvas.getContext('2d')).toBeDefined();
    expect(mockCanvas.width).toBe(imagePadding);
    expect(mockCanvas.height).toBe(imagePadding);
  });
});
