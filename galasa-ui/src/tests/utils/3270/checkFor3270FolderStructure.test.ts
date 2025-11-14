/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { TreeNodeData } from '@/utils/functions/artifacts';
import { checkForZosTerminalFolderStructure } from '@/utils/3270/checkFor3270FolderStructure';

describe('Check For Zos Terminal Folder Structure Method', () => {
  const setZos3270TerminalFolderExists = jest.fn();
  const mockSetZos3270TerminalData = jest.fn();

  const mockRootFolder: TreeNodeData = {
    name: '',
    isFile: false,
    children: {
      zos3270: {
        name: 'zos3270',
        isFile: false,
        children: {
          terminals: {
            name: 'terminals',
            isFile: false,
            children: {
              GAL91419_1: {
                name: 'GAL91419_1',
                isFile: false,
                children: {
                  'GAL91419_1-00207.gz': {
                    name: 'GAL91419_1-00207.gz',
                    runId: '',
                    url: '/artifacts/zos3270/terminals/GAL91419_1/GAL91419_1-00207.gz',
                    isFile: true,
                    children: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const mockEmptyRootFolder: TreeNodeData = {
    name: 'root',
    isFile: false,
    children: {},
  };

  beforeEach(() => {
    jest.resetModules();
    setZos3270TerminalFolderExists.mockReset();
  });

  test('sets Zos3270TerminalFolderExists to true when the structure is found', () => {
    checkForZosTerminalFolderStructure(
      mockRootFolder,
      setZos3270TerminalFolderExists,
      mockSetZos3270TerminalData
    );
    expect(setZos3270TerminalFolderExists).toHaveBeenCalledWith(true);
  });

  test('sets Zos3270TerminalFolderExists to false when empty file structure is found', () => {
    checkForZosTerminalFolderStructure(
      mockEmptyRootFolder,
      setZos3270TerminalFolderExists,
      mockSetZos3270TerminalData
    );
    expect(setZos3270TerminalFolderExists).toHaveBeenCalledWith(false);
  });

  test('sets Zos3270TerminalFolderExists to false when "zos3270" folder does not contain a "terminals" subfolder', () => {
    (mockRootFolder.children as { [key: string]: any })['zos3270'] = {
      children: {},
    };
    checkForZosTerminalFolderStructure(
      mockRootFolder,
      setZos3270TerminalFolderExists,
      mockSetZos3270TerminalData
    );
    expect(setZos3270TerminalFolderExists).toHaveBeenCalledWith(false);
  });

  test('sets Zos3270TerminalFolderExists to false when "zos3270/terminals" is not populated with one or more files', () => {
    (mockRootFolder.children.zos3270.children as { [key: string]: any })['terminals'] = {
      children: {},
    };
    checkForZosTerminalFolderStructure(
      mockRootFolder,
      setZos3270TerminalFolderExists,
      mockSetZos3270TerminalData
    );
    expect(setZos3270TerminalFolderExists).toHaveBeenCalledWith(false);
  });
});
