/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export interface FileNode {
  name: string;
  runId: string;
  url: string;
  isFile: true;
  children: {};
}

export interface FolderNode {
  name: string;
  isFile: false;
  children: { [key: string]: TreeNodeData };
}

export type TreeNodeData = FileNode | FolderNode;

export interface ArtifactDetails {
  artifactFile: string;
  fileSize: string;
  fileName: string;
  base64Data: string;
  contentType: string;
}

export type DownloadResult = { contentType: string; data: string; size: number; base64: string };
