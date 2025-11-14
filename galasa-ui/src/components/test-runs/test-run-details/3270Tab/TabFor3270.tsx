/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';
import React, { useEffect, useState } from 'react';
import TableOfScreenshots from '@/components/test-runs/test-run-details/3270Tab/TableOfScreenshots';
import DisplayTerminalScreenshot from '@/components/test-runs/test-run-details/3270Tab/DisplayTerminalScreenshot';
import ScreenshotToolbar from '@/components/test-runs/test-run-details/3270Tab/ScreenshotToolbar';
import styles from '@/styles/test-runs/test-run-details/Tab3270.module.css';
import { TreeNodeData } from '@/utils/functions/artifacts';
import ErrorPage from '@/app/error/page';
import { TerminalImage } from '@/utils/interfaces/3270Terminal';

export default function TabFor3270({
  runId,
  zos3270TerminalData,
  is3270CurrentlySelected,
  handleNavigateTo3270,
}: {
  runId: string;
  zos3270TerminalData: TreeNodeData[];
  is3270CurrentlySelected: boolean;
  handleNavigateTo3270: (highlightedRowId: string) => void;
}) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageData, setImageData] = useState<TerminalImage>();
  const [moveImageSelection, setMoveImageSelection] = useState<number>(0);
  const [cannotSwitchToPreviousImage, setCannotSwitchToPreviousImage] = useState<boolean>(true);
  const [cannotSwitchToNextImage, setCannotSwitchToNextImage] = useState<boolean>(false);
  const [highlightedRowId, setHighlightedRowId] = useState<string>('');
  const [highlightedRowInDisplayedData, setHighlightedRowInDisplayedData] = useState<boolean>(true);

  // Set the 'terminalScreen' parameter
  useEffect(() => {
    if (is3270CurrentlySelected) {
      handleNavigateTo3270(highlightedRowId);
    }

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [highlightedRowId, is3270CurrentlySelected]);

  // Get the 'terminalScreen' parameter
  useEffect(() => {
    if (is3270CurrentlySelected && highlightedRowId === '') {
      const url = new URL(window.location.href);
      setHighlightedRowId(url.searchParams.get('terminalScreen') || '');
    }

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [is3270CurrentlySelected]);

  if (isError) {
    return <ErrorPage />;
  }

  return (
    <div className={styles.tab3270Container}>
      <div className={styles.tableOfScreenshotsContainer}>
        <TableOfScreenshots
          runId={runId}
          zos3270TerminalData={zos3270TerminalData}
          isLoading={isLoading}
          setIsError={setIsError}
          setIsLoading={setIsLoading}
          setImageData={setImageData}
          moveImageSelection={moveImageSelection}
          setMoveImageSelection={setMoveImageSelection}
          setCannotSwitchToPreviousImage={setCannotSwitchToPreviousImage}
          setCannotSwitchToNextImage={setCannotSwitchToNextImage}
          highlightedRowInDisplayedData={highlightedRowInDisplayedData}
          setHighlightedRowInDisplayedData={setHighlightedRowInDisplayedData}
          highlightedRowId={highlightedRowId}
          setHighlightedRowId={setHighlightedRowId}
        />
      </div>

      <div className={styles.screenshotContainer}>
        <ScreenshotToolbar
          setMoveImageSelection={setMoveImageSelection}
          cannotSwitchToPreviousImage={cannotSwitchToPreviousImage}
          cannotSwitchToNextImage={cannotSwitchToNextImage}
          highlightedRowInDisplayedData={highlightedRowInDisplayedData}
          isLoading={isLoading}
          highlightedRowId={highlightedRowId}
          is3270CurrentlySelected={is3270CurrentlySelected}
        />
        <DisplayTerminalScreenshot imageData={imageData} isLoading={isLoading} />
      </div>
    </div>
  );
}
