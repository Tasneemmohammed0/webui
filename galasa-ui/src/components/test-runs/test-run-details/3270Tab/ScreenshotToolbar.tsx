/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';
import React, { useState, useEffect } from 'react';
import styles from '@/styles/test-runs/test-run-details/Tab3270.module.css';
import { ChevronRight, ChevronLeft, Copy, CloudDownload } from '@carbon/icons-react';
import { Button, Loading, InlineNotification } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { NotificationType } from '@/utils/types/common';
import { NOTIFICATION_VISIBLE_MILLISECS } from '@/utils/constants/common';

export default function ScreenshotToolbar({
  setMoveImageSelection,
  cannotSwitchToPreviousImage,
  cannotSwitchToNextImage,
  highlightedRowInDisplayedData,
  isLoading,
  highlightedRowId,
  is3270CurrentlySelected,
}: {
  setMoveImageSelection: React.Dispatch<React.SetStateAction<number>>;
  cannotSwitchToPreviousImage: boolean;
  cannotSwitchToNextImage: boolean;
  highlightedRowInDisplayedData: boolean;
  isLoading: boolean;
  highlightedRowId: string;
  is3270CurrentlySelected: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const translations = useTranslations('3270Tab');

  const handlePreviousImageClick = () => {
    setMoveImageSelection(-1);
  };

  const handleNextImageClick = () => {
    setMoveImageSelection(1);
  };

  // Terminal name could have a '-' in it, so need to account for an id like "third-terminal-4"
  // In that scenario, this function should return "third-terminal-00004".
  function getFileNameFromId(): string {
    const numberOfDigitsAfterDash = 5;
    const parts = highlightedRowId.split('-');
    const screenNumber = parts[parts.length - 1];

    // Ensure there is a dash
    if (parts.length < 2) {
      throw new Error('Invalid terminal ID or screen number');
    }

    let screenNumberWithPadding = parts[parts.length - 1];
    if (screenNumber.length <= numberOfDigitsAfterDash) {
      screenNumberWithPadding =
        '0'.repeat(numberOfDigitsAfterDash - screenNumber.length) + screenNumberWithPadding;
    }

    // Rejoin all parts up to the last one, in case the terminal name has a '-' in it.
    const terminalName = parts.slice(0, -1).join('-');
    return terminalName + '-' + screenNumberWithPadding;
  }

  const handleCopyImage = async () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    try {
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (!blob) {
        throw new Error('Failed to get blob from canvas');
      }

      const item = new ClipboardItem({ 'image/png': blob });

      await navigator.clipboard.write([item]);

      setNotification({
        kind: 'success',
        title: translations('copiedTitle'),
        subtitle: translations('copiedMessage'),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        const isErrorNoCanvas = err.message === 'Canvas element not found';
        setNotification({
          kind: 'error',
          title: translations('errorCopiedTitle'),
          subtitle:
            translations('copyFailedMessage') +
            (isErrorNoCanvas ? translations('copyNoCanvas') : translations('copyNoBlob')),
        });
      }
    } finally {
      setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
    }
  };

  const handleDownloadImage = () => {
    setIsDownloading(true);
    var link = document.createElement('a');
    link.download = getFileNameFromId() + '.jpeg';
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    if (canvas) {
      link.href = canvas.toDataURL();
      link.click();
    } else {
      setNotification({
        kind: 'error',
        title: translations('errorTitle'),
        subtitle: translations('downloadFailedMessage'),
      });
    }

    setIsDownloading(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!e.repeat) {
      switch (e.key) {
        case 'ArrowLeft':
          if (highlightedRowInDisplayedData && !cannotSwitchToPreviousImage && !isLoading) {
            handlePreviousImageClick();
          }
          break;

        case 'ArrowRight':
          if (highlightedRowInDisplayedData && !cannotSwitchToNextImage && !isLoading) {
            handleNextImageClick();
          }
          break;
      }
    }
  };

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  // Mount event listener to let users flick between screenshots with left and right arrow keys.
  useEffect(() => {
    if (is3270CurrentlySelected) {
      document.addEventListener('keydown', handleKeyDown);

      return cleanup;
    }

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, [
    is3270CurrentlySelected,
    isLoading,
    highlightedRowInDisplayedData,
    cannotSwitchToPreviousImage,
    cannotSwitchToNextImage,
  ]);

  return (
    <div className={styles.screenshotToolbar}>
      <div className={styles.spacer}></div>

      <div className={styles.middleAlignedButtons}>
        <Button
          onClick={handlePreviousImageClick}
          kind="ghost"
          hasIconOnly
          renderIcon={ChevronLeft}
          disabled={cannotSwitchToPreviousImage || !highlightedRowInDisplayedData || isLoading}
          iconDescription={translations('previousImage')}
        />

        <Button
          onClick={handleNextImageClick}
          kind="ghost"
          hasIconOnly
          renderIcon={ChevronRight}
          disabled={cannotSwitchToNextImage || !highlightedRowInDisplayedData || isLoading}
          iconDescription={translations('nextImage')}
        />
      </div>

      <div className={styles.rightAlignedButtons}>
        <Button
          onClick={handleCopyImage}
          renderIcon={Copy}
          kind="ghost"
          hasIconOnly
          disabled={isLoading}
          iconDescription={translations('copyImage')}
        />

        <Button
          onClick={handleDownloadImage}
          renderIcon={isDownloading ? () => <Loading small withOverlay={false} /> : CloudDownload}
          kind="ghost"
          hasIconOnly
          disabled={isLoading}
          iconDescription={
            isDownloading ? translations('downloading') : translations('downloadImage')
          }
        />
      </div>

      {notification && (
        <div className={styles.notification}>
          <InlineNotification
            title={notification.title}
            subtitle={notification.subtitle}
            kind={notification.kind}
            hideCloseButton={true}
          />
        </div>
      )}
    </div>
  );
}
