/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TreeNodeData } from '@/utils/functions/artifacts';
import { ArtifactsTab } from '@/components/test-runs/test-run-details/ArtifactsTab';
import { checkForZosTerminalFolderStructure } from '@/utils/3270/checkFor3270FolderStructure';
import { downloadArtifactFromServer } from '@/actions/runsAction';
import { handleDownload } from '@/utils/artifacts';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';

// Mock dependencies
jest.mock('@/actions/runsAction');
jest.mock('@/utils/artifacts', () => ({
  ...jest.requireActual('@/utils/artifacts'),
  handleDownload: jest.fn(),
}));
// Mock next-intl completely
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

const mockSetZos3270TerminalFolderExists = jest.fn();
const mockSetZos3270TerminalData = jest.fn();

// Mock Carbon components
jest.mock('@carbon/react', () => ({
  TreeView: ({ children, onSelect, className }: any) => (
    <div className={className} data-testid="tree-view" onClick={onSelect}>
      {children}
    </div>
  ),
  Tooltip: ({ label, children }: any) => (
    <div data-testid="tooltip">
      {label}
      {children}
    </div>
  ),
  TreeNode: ({ children, label, onSelect, onToggle, isExpanded, renderIcon }: any) => {
    const IconComponent = renderIcon;
    return (
      <div data-testid={`tree-node-${label}`} onClick={onSelect} data-expanded={isExpanded}>
        {IconComponent && <IconComponent data-testid={`icon-${label}`} />}
        <span>{label}</span>
        {onToggle && (
          <button onClick={onToggle} data-testid={`toggle-${label}`}>
            Toggle
          </button>
        )}
        {children}
      </div>
    );
  },
  InlineLoading: ({ description }: any) => <div data-testid="inline-loading">{description}</div>,
  InlineNotification: ({ title, subtitle }: any) => (
    <div data-testid="inline-notification">
      <div>{title}</div>
      <div>{subtitle}</div>
    </div>
  ),
  Tile: ({ children, className }: any) => (
    <div className={className} data-testid="tile">
      {children}
    </div>
  ),
  Button: ({ onClick, iconDescription, renderIcon: Icon }: any) => (
    <button data-testid="mock-carbon-button" aria-label={iconDescription} onClick={onClick}>
      {Icon && <Icon />}
    </button>
  ),
}));

// Mock Carbon icons
jest.mock('@carbon/icons-react', () => ({
  CloudDownload: ({ size, color }: any) => (
    <div data-testid="cloud-download-icon" data-size={size} data-color={color} />
  ),
  Document: () => <div data-testid="document-icon" />,
  Folder: () => <div data-testid="folder-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Json: () => <div data-testid="json-icon" />,
  Zip: () => <div data-testid="zip-icon" />,
}));

const mockDownloadArtifactFromServer = downloadArtifactFromServer as jest.MockedFunction<
  typeof downloadArtifactFromServer
>;
const mockHandleDownload = handleDownload as jest.MockedFunction<typeof handleDownload>;

// Import useTranslations from the mocked module
const { useTranslations } = jest.requireMock('next-intl');
const mockUseTranslations = useTranslations as jest.MockedFunction<any>;

// Mock global atob function
global.atob = jest.fn((str: string) => {
  return Buffer.from(str, 'base64').toString('binary');
});

describe('ArtifactsTab', () => {
  const mockTranslations = {
    title: 'Artifacts',
    description: 'Test artifacts description',
    downloading: 'Downloading...',
    error_title: 'Error',
    error_subtitle: 'Error downloading artifact for run {runName}',
  };

  const mockArtifacts = [
    {
      path: '/framework/test.txt',
      runId: 'run-123',
    },
    {
      path: '/framework/logs/debug.log',
      runId: 'run-123',
    },
    {
      path: '/framework/images/screenshot.png',
      runId: 'run-123',
    },
    {
      path: '/data/config.json',
      runId: 'run-123',
    },
    {
      path: '/archive/backup.zip',
      runId: 'run-123',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslations.mockReturnValue((key: string, params?: any) => {
      if (key === 'error_subtitle' && params) {
        return mockTranslations[key].replace('{runName}', params.runName);
      }
      return mockTranslations[key as keyof typeof mockTranslations] || key;
    });
  });

  describe('Component Rendering', () => {
    test('renders the component with title and description', () => {
      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={[]}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      expect(screen.getByText('Artifacts')).toBeInTheDocument();
      expect(screen.getByText('Test artifacts description')).toBeInTheDocument();
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });

    test('renders empty tree when no artifacts provided', () => {
      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={[]}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const treeView = screen.getByTestId('tree-view');
      expect(treeView).toBeInTheDocument();
      expect(treeView.children).toHaveLength(0);
    });

    test('displays default message when no file is selected', () => {
      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      expect(screen.getByText('Select a file to display its content')).toBeInTheDocument();
    });
  });

  describe('Tree Structure Building', () => {
    test('builds correct tree structure from artifacts', () => {
      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      // Check for folder nodes
      expect(screen.getByTestId('tree-node-framework')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-data')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-archive')).toBeInTheDocument();

      // Check for file nodes
      expect(screen.getByTestId('tree-node-test.txt')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-config.json')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-backup.zip')).toBeInTheDocument();
    });

    test('handles paths with leading slashes and dots correctly', () => {
      const artifactsWithVariousPaths = [
        { path: './framework/test.txt', runId: 'run-123' },
        { path: '/data/config.json', runId: 'run-123' },
        { path: 'simple/file.txt', runId: 'run-123' },
      ];

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={artifactsWithVariousPaths}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tree-node-framework')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-data')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-simple')).toBeInTheDocument();
    });

    test('removes "artifact" and "artifacts" prefix from paths', () => {
      const artifactsWithPrefix = [
        { path: '/artifact/framework/test.txt', runId: 'run-123' },
        { path: '/artifacts/data/config.json', runId: 'run-123' },
      ];

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={artifactsWithPrefix}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tree-node-framework')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-data')).toBeInTheDocument();
    });
  });

  describe('Folder Expansion', () => {
    test('toggles folder expansion state', async () => {
      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const frameworkToggle = screen.getByTestId('toggle-framework');
      const frameworkNode = screen.getByTestId('tree-node-framework');

      // Initially not expanded
      expect(frameworkNode).toHaveAttribute('data-expanded', 'false');

      // Click to expand
      fireEvent.click(frameworkToggle);

      expect(frameworkNode).toHaveAttribute('data-expanded', 'true');

      // Click to collapse
      fireEvent.click(frameworkToggle);

      expect(frameworkNode).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('File Download and Display', () => {
    test('downloads and displays text file content', async () => {
      const mockDownloadResult = {
        contentType: 'text/plain',
        data: 'Hello World!',
        size: 12,
        base64: 'SGVsbG8gV29ybGQh',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(mockDownloadArtifactFromServer).toHaveBeenCalledWith(
          'test-run',
          '/framework/test.txt'
        );
      });

      // Check if content is displayed
      expect(screen.getByText('Hello World!')).toBeInTheDocument();
      expect(screen.getByText('/framework/test.txt')).toBeInTheDocument();
      expect(screen.getByText('12 bytes')).toBeInTheDocument();
    });

    test('displays JSON content with proper formatting', async () => {
      const mockJsonData = { key: 'value', nested: { data: 123 } };
      const mockDownloadResult = {
        contentType: 'application/json',
        data: JSON.stringify(mockJsonData),
        size: 50,
        base64: 'base64data',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-config.json');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
      });
    });

    test('handles binary files correctly', async () => {
      const mockDownloadResult = {
        contentType: 'image/png',
        data: 'binarydata',
        size: 1024,
        base64: 'base64imagedata',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-screenshot.png');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByText(/This is a binary file \(image\/png\)/)).toBeInTheDocument();
      });
    });

    test('displays loading state during download', async () => {
      mockDownloadArtifactFromServer.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      expect(screen.getByTestId('inline-loading')).toBeInTheDocument();
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });

    test('displays error state on download failure', async () => {
      mockDownloadArtifactFromServer.mockRejectedValue(new Error('Download failed'));

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    test('formats small file sizes in bytes', async () => {
      const mockDownloadResult = {
        contentType: 'text/plain',
        data: 'Small file',
        size: 500,
        base64: 'base64data',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByText('500 bytes')).toBeInTheDocument();
      });
    });

    test('formats large file sizes in MB', async () => {
      const mockDownloadResult = {
        contentType: 'text/plain',
        data: 'Large file',
        size: 2097152, // 2 MB
        base64: 'base64data',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByText('2.00 MB')).toBeInTheDocument();
      });
    });
  });

  describe('Download Button', () => {
    test('handles file download when download button is clicked', async () => {
      const mockDownloadResult = {
        contentType: 'text/plain',
        data: 'Test content',
        size: 12,
        base64: 'VGVzdCBjb250ZW50', // "Test content" in base64
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-test.txt');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      await waitFor(() => {
        expect(screen.getByTestId('cloud-download-icon')).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download/i });

      await act(async () => {
        fireEvent.click(downloadButton);
      });

      expect(mockHandleDownload).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'framework/test.txt'
      );
    });
  });

  describe('Edge Cases', () => {
    test('handles artifacts with undefined paths', () => {
      const artifactsWithUndefinedPaths = [
        { path: undefined, runId: 'run-123' },
        { path: '/valid/path.txt', runId: 'run-123' },
      ];

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={artifactsWithUndefinedPaths}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      // Should only render the valid path
      expect(screen.getByTestId('tree-node-valid')).toBeInTheDocument();
    });

    test('handles artifacts with empty runId', () => {
      const artifactsWithEmptyRunId = [{ path: '/test/file.txt', runId: undefined }];

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={artifactsWithEmptyRunId}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      expect(screen.getByTestId('tree-node-file.txt')).toBeInTheDocument();
    });

    test('handles malformed JSON content gracefully', async () => {
      const mockDownloadResult = {
        contentType: 'application/json',
        data: '{ invalid json }',
        size: 15,
        base64: 'base64data',
      };

      mockDownloadArtifactFromServer.mockResolvedValue(mockDownloadResult);

      render(
        <FeatureFlagProvider>
          <ArtifactsTab
            artifacts={mockArtifacts}
            runId="test-run"
            runName="Test Run"
            setZos3270TerminalFolderExists={mockSetZos3270TerminalFolderExists}
            setZos3270TerminalData={mockSetZos3270TerminalData}
          />
        </FeatureFlagProvider>
      );

      const fileNode = screen.getByTestId('tree-node-config.json');

      await act(async () => {
        fireEvent.click(fileNode);
      });

      // Should still display the raw content even if JSON parsing fails
      await waitFor(() => {
        expect(screen.getByText('Error downloading artifact for run Test Run')).toBeInTheDocument();
      });
    });
  });
});
