/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const COLOURS_FOR_3270 = {
  BLACK: '#000',
  GREEN: '#00ff00',
};

const cellHeight = 20;
const verticalCharacterPadding = 4;
const horizontalCharacterPadding = 2;
const imagePadding = 10;
const font = cellHeight - verticalCharacterPadding + 'px Inter, monospace';
const backgroundColour = COLOURS_FOR_3270.BLACK;
const characterColour = COLOURS_FOR_3270.GREEN;

export {
  cellHeight,
  horizontalCharacterPadding,
  imagePadding,
  font,
  backgroundColour,
  characterColour,
};
