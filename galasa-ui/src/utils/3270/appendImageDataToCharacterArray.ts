/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {
  TerminalImage,
  TerminalImageField,
  TerminalImageCharacter,
} from '@/utils/interfaces/3270Terminal';

export function appendImageDataToCharacterArray(
  imageData: TerminalImage,
  rows: number,
  columns: number,
  characterArray: (TerminalImageCharacter | null)[][]
) {
  imageData.fields.forEach(
    function extractCharactersFromImageFieldInto2dArrayWithDetailedImageFieldProperties(
      imageField: TerminalImageField
    ) {
      // Skip over an empty contents field, or one without any text
      if (
        Array.isArray(imageField.contents) &&
        imageField.contents.length > 0 &&
        (imageField.contents[0].text || imageField.contents[0].characters)
      ) {
        // Get image text by first checking the "text" field, then "characters" (must join() as it is type string[]), otherwise null.
        let imageText: string | null = null;

        if (imageField.contents[0].text) {
          imageText = imageField.contents[0].text;
        } else if (imageField.contents[0].characters) {
          imageText = imageField.contents[0].characters.join('');
        }

        // Check for contents inside the imageText before looping through each character.
        if (imageText && imageText.length > 0) {
          let charRow = imageField.row;
          let charColumnWithWraparound = imageField.column;

          // Loop through each character in the imageText, adding to the 2D array.
          for (let charIndex = 0; charIndex < imageText.length; charIndex++) {
            // Separate out the row, column and contents as these are all negligable now it's in a 2D array.
            const { row, column, contents, ...rawTerminalImageFieldDetails } = imageField;

            // Ensure terminalImageFieldDetails is an object
            const terminalImageFieldDetails = rawTerminalImageFieldDetails || {};

            // Append the character to all the parent's TerminalImageFieldDetails.
            const terminalImageCharacter: TerminalImageCharacter = {
              character: imageText.charAt(charIndex),
              ...terminalImageFieldDetails,
            };

            // Check if out of bounds.
            if (
              charRow >= rows ||
              charRow < 0 ||
              charColumnWithWraparound >= columns ||
              charColumnWithWraparound < 0
            ) {
              throw new Error('Invalid image data - image data out of bounds');
            }
            // Check if an element is already there.
            if (characterArray[charRow][charColumnWithWraparound]) {
              throw new Error('Invalid image data - image data overlapping');
            }

            // Place string into character array.
            characterArray[charRow][charColumnWithWraparound] = terminalImageCharacter;

            // Increment column number, then check if the text needs to wrap around to the next row.
            charColumnWithWraparound++;
            if (charColumnWithWraparound >= columns) {
              charColumnWithWraparound = 0;
              charRow++;
            }
          }
        }
      }
    }
  );
}
