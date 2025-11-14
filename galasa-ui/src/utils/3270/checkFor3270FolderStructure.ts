/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { FolderNode, TreeNodeData } from '@/utils/functions/artifacts';

export const checkForZosTerminalFolderStructure = (
  root: FolderNode,
  setZos3270TerminalFolderExists: (exists: boolean) => void,
  setZos3270TerminalData: (data: TreeNodeData[]) => void
) => {
  if (root.children) {
    for (const key in root.children) {
      const childNode = root.children[key];
      if (
        childNode.name === 'zos3270' &&
        childNode.isFile === false &&
        'terminals' in childNode.children
      ) {
        const terminalsFolder = childNode.children['terminals'];
        if (terminalsFolder.isFile === false && Object.keys(terminalsFolder.children).length > 0) {
          setZos3270TerminalFolderExists(true);

          const terminals: TreeNodeData[] = Object.values(terminalsFolder.children);
          setZos3270TerminalData(terminals);

          return;
        }
      }
    }
  }
  setZos3270TerminalFolderExists(false);
};
