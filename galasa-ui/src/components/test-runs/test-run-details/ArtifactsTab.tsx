/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { ArtifactIndexEntry } from '@/generated/galasaapi';
import { TreeView, TreeNode, InlineLoading, InlineNotification } from '@carbon/react';
import React, { useEffect, useState } from 'react';
import styles from '@/styles/test-runs/test-run-details/Artifacts.module.css';
import {
  CarbonIconType,
  CloudDownload,
  Document,
  Folder,
  Image,
  Json,
  Zip,
} from '@carbon/icons-react';
import { downloadArtifactFromServer } from '@/actions/runsAction';
import { Tile } from '@carbon/react';
import { cleanArtifactPath, handleDownload } from '@/utils/artifacts';
import { useTranslations } from 'next-intl';
import { Button } from '@carbon/react';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags';
import {
  FolderNode,
  ArtifactDetails,
  TreeNodeData,
  DownloadResult,
} from '@/utils/functions/artifacts';
import { checkForZosTerminalFolderStructure } from '@/utils/3270/checkFor3270FolderStructure';

export function ArtifactsTab({
  artifacts,
  runId,
  runName,
  setZos3270TerminalFolderExists,
  setZos3270TerminalData,
}: {
  artifacts: ArtifactIndexEntry[];
  runId: string;
  runName: string;
  setZos3270TerminalFolderExists: (exists: boolean) => void;
  setZos3270TerminalData: (zos3270TerminalData: TreeNodeData[]) => void;
}) {
  const translations = useTranslations('Artifacts');
  const [treeData, setTreeData] = useState<FolderNode>({
    name: '',
    isFile: false,
    children: {},
  });

  const [artifactDetails, setArtifactDetails] = useState<ArtifactDetails>({
    artifactFile: '',
    fileSize: '',
    fileName: '',
    base64Data: '',
    contentType: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>({});

  const ZIP_EXTENSIONS = ['zip', 'gz', 'jar', 'rar', '7z'];
  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

  function formatFileSize(bytes: number) {
    let fileSize = '';

    if (bytes < 10000) {
      fileSize = `${bytes} bytes`;
    } else {
      const mb = bytes / (1024 * 1024);
      fileSize = `${mb.toFixed(2)} MB`;
    }

    return fileSize;
  }

  const handleDownloadClick = () => {
    if (artifactDetails.base64Data) {
      // (a) Turn Base64 string → binary string
      const binaryString = atob(artifactDetails.base64Data);
      // (b) Convert binary string → Uint8Array
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const cleanFileName = artifactDetails.fileName.startsWith('/')
        ? artifactDetails.fileName.slice(1)
        : artifactDetails.fileName; //strip any leading slashes

      handleDownload(bytes.buffer, cleanFileName);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      // Toggle just this folder's state
      [path]: !prev[path],
    }));
  };

  const downloadArtifact = async (runId: string, artifactUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const result: DownloadResult = await downloadArtifactFromServer(runId, artifactUrl);

      setArtifactDetails({
        artifactFile: result.data,
        fileSize: formatFileSize(result.size),
        fileName: artifactUrl,
        base64Data: result.base64,
        contentType: result.contentType,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  function renderArtifactContent(artifactFile: string, contentType: string) {
    let result;

    // 1) Nothing selected
    if (!artifactFile) {
      result = <p>Select a file to display its content</p>;
    }
    // 2) Plain-text (or any text/* MIME)
    else if (contentType.startsWith('text/')) {
      result = <pre>{artifactFile}</pre>;
    }
    // 3) JSON (or JS object)
    else if (contentType.includes('json') || typeof artifactFile === 'object') {
      // if it's a string, try to parse it first
      let data = artifactFile;
      if (typeof artifactFile === 'string') {
        try {
          data = JSON.parse(artifactFile);
        } catch (err) {
          setError('Error parsing JSON content');
          console.error('Error parsing file: ', err);
        }
      }
      result = <pre>{JSON.stringify(data, null, 2)}</pre>; //preventing any filtering and ensuring identation of two spaces
    }
    // 4) Binary (zip, images, etc.)
    else {
      result = <p>This is a binary file ({contentType}), please download it to see its content.</p>;
    }

    return result;
  }

  useEffect(() => {
    // Build the root node, which holds top-level folders and files
    const root: FolderNode = { name: '', isFile: false, children: {} };

    artifacts.forEach((artifact) => {
      // 1) Get the raw path string, default to empty if undefined
      const rawPath = artifact.path ?? '';

      // 2) Remove a leading "/" or "./" if present
      let cleanedPath = cleanArtifactPath(rawPath);

      // 3) Split into segments and drop any empty strings
      let segments = cleanedPath.split('/').filter((seg) => seg !== '');

      // 4) If the first segment is "artifact" or "artifacts", drop it so that
      //    "artifact/framework" becomes ["framework", ...]
      const segmentValue = segments[0]?.toLocaleLowerCase();

      if (segmentValue === 'artifact' || segmentValue === 'artifacts') {
        segments = segments.slice(1);
      }

      if (segments.length > 0) {
        let currentNode: FolderNode = root;
        createFolderSegments(segments, currentNode, artifact);
      }
    });

    setTreeData(root);

    // This checks for the terminal structure, and sets the zosTerminalData hook in TestRunDetails for later use in get3270Screenshots.ts.
    checkForZosTerminalFolderStructure(
      root,
      setZos3270TerminalFolderExists,
      setZos3270TerminalData
    );

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [artifacts, checkForZosTerminalFolderStructure]);

  const createFolderSegments = (
    segments: string[],
    currentNode: FolderNode,
    artifact: ArtifactIndexEntry
  ) => {
    return segments.forEach((segment, idx) => {
      const isLast = idx === segments.length - 1;

      if (isLast) {
        // It’s a file: insert a FileNode under currentNode.children
        currentNode.children[segment] = {
          name: segment,
          runId: artifact.runId ?? '',
          url: artifact.path ?? '',
          isFile: true,
          children: {},
        };
      } else {
        // It’s a folder: create or reuse a FolderNode
        const existing = currentNode.children[segment];

        if (!existing) {
          // Create new folder if it doesn’t exist
          currentNode.children[segment] = {
            name: segment,
            isFile: false,
            children: {},
          };
          currentNode = currentNode.children[segment] as FolderNode;
        } else if (existing.isFile) {
          // Conflict: a file was created here before. Replace it with a folder.
          currentNode.children[segment] = {
            name: segment,
            isFile: false,
            children: {},
          };
          currentNode = currentNode.children[segment] as FolderNode;
        } else {
          // Descend into existing folder
          currentNode = existing as FolderNode;
        }
      }
    });
  };

  const renderFileIcon = (path: string) => {
    const pathSplit = path.split('.');
    const extension = pathSplit[pathSplit.length - 1]; // get the last split e.g some.file.ts -> we need the extension (ts)
    let icon: CarbonIconType = Document;

    if (ZIP_EXTENSIONS.includes(extension)) {
      icon = Zip;
    } else if (extension == 'json') {
      icon = Json;
    } else if (IMAGE_EXTENSIONS.includes(extension)) {
      icon = Image;
    }

    return icon;
  };

  // Recursive renderer: emits a <TreeNode> for each TreeNodeData
  const renderNode = (node: TreeNodeData, path: string) => {
    let treeNode;
    const isExpanded = expandedFolders[path] || false;

    if (node.isFile) {
      // Leaf file node
      treeNode = (
        <TreeNode
          key={path}
          id={path}
          renderIcon={renderFileIcon(path)}
          label={node.name}
          value={node.name}
          onSelect={() => downloadArtifact(runId, node.url)}
        />
      );
    } else {
      // Folder node: render label, then recurse on children
      treeNode = (
        <TreeNode
          onToggle={() => toggleFolder(path)}
          isExpanded={isExpanded}
          key={path}
          id={path}
          label={node.name}
          value={node.name}
          renderIcon={Folder}
        >
          {Object.values(node.children).map((child) => {
            const childPath = path ? `${path}/${child.name}` : child.name;
            return renderNode(child, childPath);
          })}
        </TreeNode>
      );
    }

    return treeNode;
  };

  return (
    <>
      <div className={styles.titleContainer}>
        <h3>{translations('title')}</h3>
        <p>{translations('description')}</p>
      </div>
      <div className={styles.artifact}>
        <TreeView className={styles.tree} onSelect={() => {}}>
          {Object.values(treeData.children).map((child) => renderNode(child, child.name))}
        </TreeView>

        <div className={styles.artifactView}>
          {loading && (
            <InlineLoading
              description={translations('downloading')}
              iconDescription={translations('downloading')}
            />
          )}
          {error && (
            <InlineNotification
              title={translations('error_title')}
              subtitle={translations('error_subtitle', { runName })}
            />
          )}

          {!loading && !error && (
            <div>
              <div>
                {artifactDetails.artifactFile !== '' && (
                  <Tile className={styles.toolbar}>
                    <div>
                      <h5>{artifactDetails.fileName}</h5>
                      <p className={styles.fileSize}>{artifactDetails.fileSize}</p>
                    </div>
                    <div className={styles.toolbarOptions}>
                      <Button
                        kind="ghost"
                        renderIcon={CloudDownload}
                        hasIconOnly
                        iconDescription={translations('download_button')}
                        onClick={handleDownloadClick}
                      />
                    </div>
                  </Tile>
                )}
              </div>

              <pre className={styles.fileRenderer}>
                {renderArtifactContent(artifactDetails.artifactFile, artifactDetails.contentType)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
