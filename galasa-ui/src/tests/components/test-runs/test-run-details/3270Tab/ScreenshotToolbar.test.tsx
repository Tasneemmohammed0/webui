// Assisted by watsonx Code Assistant

/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { act, render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScreenshotToolbar from '@/components/test-runs/test-run-details/3270Tab/ScreenshotToolbar';
import userEvent from '@testing-library/user-event';

const translations: Record<string, string> = {
  Terminal: 'Terminal',
  screenNumber: 'Screen Number',
  searchPlaceholder: 'Search',
  nextImage: 'Next image',
  previousImage: 'Previous image',
  copyImage: 'Copy image to clipboard',
  downloadImage: 'Download image',
  copiedTitle: 'Image copy successful: ',
  copiedMessage: 'The 3270 screenshot image has been successfully copied to your clipboard.',
  errorCopyTitle: 'Image copy unsuccessful: ',
  copyFailedMessage: 'The 3270 screenshot image has failed to copy to your clipboard. Error: ',
  copyNoCanvas: 'canvas element not found.',
  copyNoBlob: 'failed to get blob from canvas.',
  downloadErrortitle: 'Image download unsuccessful: ',
  downloadFailedMessage:
    'The 3270 screenshot image has failed to be downloaded. Could not find canvas element to download image.',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    return translations[key] || key;
  },
}));

describe('ScreenshotToolbar', () => {
  const mockSetMoveImageSelection = jest.fn();

  const setup = async (overrides: any = {}) => {
    const renderedComponent = await act(async () => {
      return render(
        <ScreenshotToolbar
          setMoveImageSelection={mockSetMoveImageSelection}
          cannotSwitchToPreviousImage={false}
          cannotSwitchToNextImage={false}
          highlightedRowInDisplayedData={true}
          isLoading={false}
          highlightedRowId="third-terminal-4"
          is3270CurrentlySelected={true}
          {...overrides}
        />
      );
    });
    return renderedComponent;
  };

  test('renders without crashing', async () => {
    const renderedComponent = await setup();

    expect(renderedComponent.container).toBeInTheDocument();
  });

  test('handles previous image click', async () => {
    const renderedComponent = await setup();

    const prevButton = renderedComponent.getByRole('button', { name: translations.previousImage });
    fireEvent.click(prevButton);

    expect(mockSetMoveImageSelection).toHaveBeenCalledWith(-1);
  });

  test('handles next image click', async () => {
    const renderedComponent = await setup();

    const nextButton = renderedComponent.getByRole('button', { name: translations.nextImage });
    fireEvent.click(nextButton);

    expect(mockSetMoveImageSelection).toHaveBeenCalledWith(1);
  });

  test('handles keydown events', async () => {
    const user = userEvent.setup();

    const renderedComponent = setup();

    await user.keyboard('{arrowleft}');
    expect(mockSetMoveImageSelection).toHaveBeenCalledWith(-1);

    await user.keyboard('{ArrowRight}');
    expect(mockSetMoveImageSelection).toHaveBeenCalledWith(1);
  });

  test('copy image no cavas', async () => {
    const renderedComponent = await setup();

    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });

    await act(async () => {
      fireEvent.click(copyButton);
    });

    const content = await screen.findByText(
      'The 3270 screenshot image has failed to copy to your clipboard. Error: canvas element not found.'
    );
    expect(content).toBeInTheDocument();
  });

  test('copy image failed blob', async () => {
    const toBlobSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => {
        callback(null);
      });

    const renderedComponent = await setup();

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    document.body.appendChild(canvas);

    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });

    await act(async () => {
      fireEvent.click(copyButton);
    });

    const content = await screen.findByText(
      'The 3270 screenshot image has failed to copy to your clipboard. Error: failed to get blob from canvas.'
    );
    expect(content).toBeInTheDocument();

    toBlobSpy.mockRestore();
    document.body.removeChild(canvas);
  });

  test('handles download image click', async () => {
    const renderedComponent = await setup();

    const downloadButton = renderedComponent.getByRole('button', {
      name: translations.downloadImage,
    });

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    const content = await screen.findByText(translations.downloadFailedMessage);
    expect(content).toBeInTheDocument();
  });

  test('disables previous button when cannot switch to previous image', async () => {
    const renderedComponent = await setup({ cannotSwitchToPreviousImage: true });

    const prevButton = renderedComponent.getByRole('button', { name: translations.previousImage });
    const nextButton = renderedComponent.getByRole('button', { name: translations.nextImage });
    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });
    const downloadButton = renderedComponent.getByRole('button', {
      name: translations.downloadImage,
    });

    expect(prevButton).toHaveAttribute('disabled');
    expect(nextButton).not.toHaveAttribute('disabled');
    expect(copyButton).not.toHaveAttribute('disabled');
    expect(downloadButton).not.toHaveAttribute('disabled');
  });

  test('disables next button when cannot switch to next image', async () => {
    const renderedComponent = await setup({ cannotSwitchToNextImage: true });

    const prevButton = renderedComponent.getByRole('button', { name: translations.previousImage });
    const nextButton = renderedComponent.getByRole('button', { name: translations.nextImage });
    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });
    const downloadButton = renderedComponent.getByRole('button', {
      name: translations.downloadImage,
    });

    expect(prevButton).not.toHaveAttribute('disabled');
    expect(nextButton).toHaveAttribute('disabled');
    expect(copyButton).not.toHaveAttribute('disabled');
    expect(downloadButton).not.toHaveAttribute('disabled');
  });

  test('disables buttons when highlighted row not in displayed', async () => {
    const renderedComponent = await setup({ highlightedRowInDisplayedData: false });

    const prevButton = renderedComponent.getByRole('button', { name: translations.previousImage });
    const nextButton = renderedComponent.getByRole('button', { name: translations.nextImage });
    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });
    const downloadButton = renderedComponent.getByRole('button', {
      name: translations.downloadImage,
    });

    expect(prevButton).toHaveAttribute('disabled');
    expect(nextButton).toHaveAttribute('disabled');
    expect(copyButton).not.toHaveAttribute('disabled');
    expect(downloadButton).not.toHaveAttribute('disabled');
  });

  test('disables buttons when loading', async () => {
    const renderedComponent = await setup({ isLoading: true });

    const prevButton = renderedComponent.getByRole('button', { name: translations.previousImage });
    const nextButton = renderedComponent.getByRole('button', { name: translations.nextImage });
    const copyButton = renderedComponent.getByRole('button', { name: translations.copyImage });
    const downloadButton = renderedComponent.getByRole('button', {
      name: translations.downloadImage,
    });

    expect(prevButton).toHaveAttribute('disabled');
    expect(nextButton).toHaveAttribute('disabled');
    expect(copyButton).toHaveAttribute('disabled');
    expect(downloadButton).toHaveAttribute('disabled');
  });
});
