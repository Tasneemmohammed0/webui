/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export const generateUniqueQueryName = (
  queryTitle: string,
  isQuerySaved: (title: string) => boolean
): string => {
  let finalQueryTitle = queryTitle;

  // Ensure unique query name
  if (isQuerySaved(finalQueryTitle)) {
    const baseName = queryTitle.split('(')[0].trim();
    let counter = 1;

    while (isQuerySaved(finalQueryTitle)) {
      finalQueryTitle = `${baseName} (${counter})`;
      counter++;
    }
  }

  return finalQueryTitle;
};
