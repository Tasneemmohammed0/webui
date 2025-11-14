/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import TestRunDetails from '@/components/test-runs/test-run-details/TestRunDetails';
import { downloadArtifactFromServer } from '@/actions/runsAction';
import { cleanArtifactPath, handleDownload } from '@/utils/artifacts';
import { TEST_RUN_PAGE_TABS } from '@/utils/constants/common';

function setup<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let mockRouter: { replace: jest.Mock };

jest.mock('next/navigation', () => ({
  // The key is to return the mockRouter variable directly.
  useRouter: () => mockRouter,
  usePathname: jest.fn(() => '/test-runs/some-run-id'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/actions/runsAction');

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: any) =>
    opts?.runName ? `title:${opts.runName}` : key,
}));

// Mock the useDateTimeFormat context
const mockFormatDate = (date: Date) => date.toLocaleString();
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => ({
    formatDate: mockFormatDate,
  }),
}));

jest.mock('@/components/common/BreadCrumb', () => {
  const BreadCrumb = ({ breadCrumbItems }: { breadCrumbItems: any[] }) => {
    const testRunsItem = breadCrumbItems.find((item) => item.title === 'testRuns');
    return (
      <nav data-testid="breadcrumb" data-route={testRunsItem?.route || ''}>
        Breadcrumb
      </nav>
    );
  };
  BreadCrumb.displayName = 'BreadCrumb';
  return {
    __esModule: true,
    default: BreadCrumb,
  };
});

jest.mock('@/components/PageTile', () => {
  const PageTile = ({ translationKey }: any) => <h1 data-testid="pagetile">{translationKey}</h1>;
  PageTile.displayName = 'PageTile';
  return {
    __esModule: true,
    default: PageTile,
  };
});

jest.mock('@/components/test-runs/test-run-details/OverviewTab', () => {
  const OverviewTab = ({ metadata }: any) => <div>OverviewTab result={metadata?.result}</div>;
  OverviewTab.displayName = 'OverviewTab';
  return {
    __esModule: true,
    default: OverviewTab,
  };
});

jest.mock('@/components/test-runs/test-run-details/MethodsTab', () => {
  const MethodsTab = ({ methods, onMethodClick }: any) => (
    <div>
      <p>MethodsTab count={methods?.length}</p>
      <button
        data-testid="mock-method-button"
        onClick={() => onMethodClick({ runLogStartLine: 123 })}
      >
        Clickable Mock Method
      </button>
    </div>
  );
  MethodsTab.displayName = 'MethodsTab';
  return {
    __esModule: true,
    default: MethodsTab,
  };
});

jest.mock('@/components/test-runs/test-run-details/LogTab', () => {
  const LogTab = ({ logs }: any) => <div>LogTab logs={logs}</div>;
  LogTab.displayName = 'LogTab';
  return {
    __esModule: true,
    default: LogTab,
  };
});

jest.mock('@/components/test-runs/test-run-details/ArtifactsTab', () => {
  const ArtifactsTab = ({ artifacts, runName, runId }: any) => (
    <div>
      ArtifactsTab count={artifacts.length} runName={runName} runId={runId}
    </div>
  );
  ArtifactsTab.displayName = 'ArtifactsTab';
  return {
    __esModule: true,
    ArtifactsTab,
  };
});

jest.mock('@/app/error/page', () => {
  const ErrorPage = () => <div>ErrorPage</div>;
  ErrorPage.displayName = 'ErrorPage';
  return {
    __esModule: true,
    default: ErrorPage,
  };
});

jest.mock('@/components/test-runs/test-run-details/TestRunSkeleton', () => {
  const TestRunSkeleton = () => <div>Skeleton</div>;
  TestRunSkeleton.displayName = 'TestRunSkeleton';
  return {
    __esModule: true,
    default: TestRunSkeleton,
  };
});

jest.mock('@/components/common/StatusIndicator', () => {
  const StatusIndicator = ({ status }: any) => <span>StatusIndicator:{status}</span>;
  StatusIndicator.displayName = 'StatusIndicator';
  return {
    __esModule: true,
    default: StatusIndicator,
  };
});

// Carbon React mocks
jest.mock('@carbon/react', () => {
  let onTabsChange: (event: { selectedIndex: number }) => void;
  const Tabs = ({ children, onChange }: any) => {
    onTabsChange = onChange;
    return <div>{children}</div>;
  };
  const Tab = ({ children, renderIcon }: any) => {
    const tabText = children;
    const tabIndex = ['tabs.overview', 'tabs.methods', 'tabs.runLog', 'tabs.artifacts'].indexOf(
      tabText
    );

    const Icon = renderIcon;

    return (
      <button
        // When this button is clicked, call the stored onChange handler
        onClick={() => onTabsChange({ selectedIndex: tabIndex })}
        // Use the text to make it findable in the test
        role="tab"
      >
        {Icon && <Icon />}
        {tabText}
      </button>
    );
  };
  const TabList = ({ children }: any) => <div>{children}</div>;
  const TabPanels = ({ children }: any) => <div>{children}</div>;
  const TabPanel = ({ children }: any) => <div>{children}</div>;
  const Loading = () => <div>Loading</div>;
  const Tile = ({ children }: any) => <div data-testid="tile">{children}</div>;
  const InlineNotification = ({ title, subtitle, kind, className }: any) => (
    <div className={className}>
      <strong>{title}</strong>
      <p>{subtitle}</p>
      <span>{kind}</span>
    </div>
  );
  const Button = ({ children, renderIcon, ...props }: any) => {
    const Icon = renderIcon;
    return (
      <button {...props}>
        {Icon && <Icon />}
        {children}
      </button>
    );
  };
  [Tab, Tabs, TabList, TabPanels, TabPanel, Loading, InlineNotification, Button].forEach((c) => {
    // @ts-ignore
    // Assigning displayName to function components for better debugging in React DevTools.
    // TypeScript does not allow this by default, so we suppress the error.
    c.displayName = c.name || 'Anonymous';
  });
  Tile.displayName = 'Tile';
  return { Tab, Tabs, TabList, TabPanels, TabPanel, Loading, Tile, InlineNotification, Button };
});

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

jest.mock('@/utils/artifacts', () => ({
  handleDownload: jest.fn(),
  cleanArtifactPath: jest.fn((path: string) => path.replace(/^\//, '')),
}));

const mockDownloadArtifactFromServer = downloadArtifactFromServer as jest.Mock;
const mockHandleDownload = handleDownload as jest.Mock;
const mockCleanArtifactPath = cleanArtifactPath as jest.Mock;

describe('TestRunDetails', () => {
  const runId = 'run-123';

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn(),
    };

    jest.clearAllMocks();

    mockDownloadArtifactFromServer.mockClear();
    mockHandleDownload.mockClear();
    mockCleanArtifactPath.mockClear();
  });

  it('shows the skeleton while loading', async () => {
    const runDetailsDeferred = setup<any>();
    const runArtifactsDeferred = setup<any[]>();
    const runLogDeferred = setup<string>();

    render(
      <TestRunDetails
        runId={runId}
        runDetailsPromise={runDetailsDeferred.promise}
        runArtifactsPromise={runArtifactsDeferred.promise}
        runLogPromise={runLogDeferred.promise}
      />
    );

    expect(screen.getByText('Skeleton')).toBeInTheDocument();

    await act(async () => {
      runDetailsDeferred.resolve({
        testStructure: {
          methods: [],
          result: 'PASS',
          status: 'OK',
          runName: 'r1',
          testShortName: 't1',
          bundle: 'b1',
          submissionId: 's1',
          group: 'g1',
          requestor: 'u1',
          queued: '2025-01-01T00:00:00Z',
          startTime: '2025-01-01T00:00:00Z',
          endTime: '2025-01-01T01:00:00Z',
          tags: [],
        },
      });
      runArtifactsDeferred.resolve([]);
      runLogDeferred.resolve('');
    });
  });

  it('renders all tabs with correct props after successful load', async () => {
    const runDetailsDeferred = setup<any>();
    const runArtifactsDeferred = setup<any[]>();
    const runLogDeferred = setup<string>();

    render(
      <TestRunDetails
        runId={runId}
        runDetailsPromise={runDetailsDeferred.promise}
        runArtifactsPromise={runArtifactsDeferred.promise}
        runLogPromise={runLogDeferred.promise}
      />
    );

    // Resolve all three promises
    await act(async () => {
      runDetailsDeferred.resolve({
        testStructure: {
          methods: [{ name: 'm1' }, { name: 'm2' }],
          result: 'FAIL',
          status: 'ERROR',
          runName: 'MyRun',
          testShortName: 'TestA',
          bundle: 'BundleX',
          submissionId: 'Sub123',
          group: 'Grp',
          requestor: 'User',
          queued: '2025-01-01T00:00:00Z',
          startTime: '2025-01-01T00:00:00Z',
          endTime: '2025-01-01T02:00:00Z',
          tags: ['tag1'],
        },
      });
      runArtifactsDeferred.resolve([{ id: 'art1' }, { id: 'art2' }]);
      runLogDeferred.resolve('This is the log');
    });

    expect(await screen.findByText('title:MyRun')).toBeInTheDocument();
    expect(screen.getByText('OverviewTab result=FAIL')).toBeInTheDocument();
    expect(screen.getByText('MethodsTab count=2')).toBeInTheDocument();
    expect(screen.getByText('LogTab logs=This is the log')).toBeInTheDocument();
    expect(
      screen.getByText(`ArtifactsTab count=2 runName=MyRun runId=${runId}`)
    ).toBeInTheDocument();

    expect(screen.getByText('StatusIndicator:FAIL')).toBeInTheDocument();
  });

  it('renders the error page if any promise rejects', async () => {
    const runDetailsDeferred = setup<any>();
    const runArtifactsDeferred = setup<any[]>();
    const runLogDeferred = setup<string>();

    render(
      <TestRunDetails
        runId={runId}
        runDetailsPromise={runDetailsDeferred.promise}
        runArtifactsPromise={runArtifactsDeferred.promise}
        runLogPromise={runLogDeferred.promise}
      />
    );

    await act(async () => {
      runDetailsDeferred.reject(new Error('failed to load'));
      runArtifactsDeferred.resolve([]);
      runLogDeferred.resolve('');
    });

    expect(await screen.findByText('ErrorPage')).toBeInTheDocument();
  });

  it('copies the URL when share button is clicked', async () => {
    const runDetailsDeferred = setup<any>();
    const runArtifactsDeferred = setup<any[]>();
    const runLogDeferred = setup<string>();

    render(
      <TestRunDetails
        runId="run-123"
        runDetailsPromise={runDetailsDeferred.promise}
        runArtifactsPromise={runArtifactsDeferred.promise}
        runLogPromise={runLogDeferred.promise}
      />
    );

    await act(async () => {
      runDetailsDeferred.resolve({
        testStructure: {
          methods: [],
          result: 'PASS',
          status: 'OK',
          runName: 'X',
          testShortName: 't',
          bundle: '',
          submissionId: '',
          group: '',
          requestor: '',
          queued: '',
          startTime: '',
          endTime: '',
          tags: [],
        },
      });
      runArtifactsDeferred.resolve([]);
      runLogDeferred.resolve('');
    });

    const spy = jest.spyOn(navigator.clipboard, 'writeText');
    fireEvent.click(screen.getByTestId('icon-Share'));

    expect(spy).toHaveBeenCalledWith(window.location.href);
    spy.mockRestore();
  });

  describe('download artifacts', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockRestore();
    });

    test('correctly calls the zip endpoint and initiates download on success', async () => {
      const runDetailsDeferred = setup<any>();
      const runArtifactsDeferred = setup<any[]>();
      const runLogDeferred = setup<string>();

      // Mock the successful fetch response
      const mockBlob = new Blob(['mock-zip-content'], { type: 'application/zip' });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('attachment; filename="TestRun-from-server.zip"'),
        },
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      render(
        <TestRunDetails
          runId={runId}
          runDetailsPromise={runDetailsDeferred.promise}
          runArtifactsPromise={runArtifactsDeferred.promise}
          runLogPromise={runLogDeferred.promise}
        />
      );

      // Resolve promises to load the component's data
      await act(async () => {
        runDetailsDeferred.resolve({
          testStructure: {
            methods: [],
            result: 'PASS',
            status: 'OK',
            runName: 'TestRun',
            testShortName: 'Test',
            bundle: 'Bundle',
            submissionId: 'Submission',
            group: 'Group',
            requestor: 'Requestor',
            queued: '2025-01-01T00:00:00Z',
            startTime: '2025-01-01T00:00:00Z',
            endTime: '2025-01-01T01:00:00Z',
            tags: [],
          },
        });
        runArtifactsDeferred.resolve([{ path: '/logs/debug.log' }]);
        runLogDeferred.resolve('Log content');
      });

      // Act
      const downloadButton = screen.getByTestId('icon-download-all');
      fireEvent.click(downloadButton);

      // Check for loading state
      expect(await screen.findByText('Loading')).toBeInTheDocument();

      // Wait for all async operations in handleDownloadAll to complete
      await waitFor(() => {
        expect(handleDownload).toHaveBeenCalled();
      });

      // Verify the correct API endpoint was called
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost/internal-api/test-runs/${runId}/zip?runName=TestRun`
      );

      expect(handleDownload).toHaveBeenCalledWith(mockBlob, 'TestRun-from-server.zip');
      // Ensure loading state is gone
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    test('shows an error notification if download fails', async () => {
      const runDetailsDeferred = setup<any>();
      const runArtifactsDeferred = setup<any[]>();
      const runLogDeferred = setup<string>();

      render(
        <TestRunDetails
          runId={runId}
          runDetailsPromise={runDetailsDeferred.promise}
          runArtifactsPromise={runArtifactsDeferred.promise}
          runLogPromise={runLogDeferred.promise}
        />
      );

      // Resolve promises to load the component's data
      await act(async () => {
        runDetailsDeferred.resolve({
          testStructure: {
            methods: [],
            result: 'PASS',
            status: 'OK',
            runName: 'TestRun',
            testShortName: 'Test',
            bundle: 'Bundle',
            submissionId: 'Submission',
            group: 'Group',
            requestor: 'Requestor',
            queued: '2025-01-01T00:00:00Z',
            startTime: '2025-01-01T00:00:00Z',
            endTime: '2025-01-01T01:00:00Z',
            tags: [],
          },
        });
        runArtifactsDeferred.resolve([{ path: '/logs/debug.log' }]);
        runLogDeferred.resolve('Log content');
      });
      mockDownloadArtifactFromServer.mockRejectedValue(new Error('Download failed'));

      const downloadButton = screen.getByTestId('icon-download-all');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/downloadError/i)).toBeInTheDocument();
      });
    });
  });

  describe('URL handling', () => {
    const mockTestStructure = {
      methods: [],
      result: 'PASS',
      status: 'OK',
      runName: 'TestRun',
      testShortName: 'Test',
      bundle: 'Bundle',
      submissionId: 'Submission',
      group: 'Group',
      requestor: 'Requestor',
      queued: '2025-01-01T00:00:00Z',
      startTime: '2025-01-01T00:00:00Z',
      endTime: '2025-01-01T01:00:00Z',
      tags: [],
    };

    test('updates URL with the current tab', async () => {
      const runDetailsDeferred = setup<any>();
      const runArtifactsDeferred = setup<any[]>();
      const runLogDeferred = setup<string>();

      render(
        <TestRunDetails
          runId={runId}
          runDetailsPromise={runDetailsDeferred.promise}
          runArtifactsPromise={runArtifactsDeferred.promise}
          runLogPromise={runLogDeferred.promise}
        />
      );

      // Resolve promises to load the component's data
      await act(async () => {
        runDetailsDeferred.resolve({
          testStructure: mockTestStructure,
        });
        runArtifactsDeferred.resolve([{ path: '/logs/debug.log' }]);
        runLogDeferred.resolve('Log content');
      });

      await screen.findByText('title:TestRun');

      // Click on the "Methods" tab
      const methodsTabButton = screen.getByRole('tab', { name: 'tabs.methods' });
      fireEvent.click(methodsTabButton);

      // Check that the router has been called correctly
      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith(`/test-runs/some-run-id?tab=methods`, {
        scroll: false,
      });

      // Click on the "Artifacts" tab
      const artifactsTabButton = screen.getByRole('tab', { name: 'tabs.artifacts' });
      fireEvent.click(artifactsTabButton);

      // Check that the router has been called correctly
      expect(mockRouter.replace).toHaveBeenCalledTimes(2);
      expect(mockRouter.replace).toHaveBeenCalledWith('/test-runs/some-run-id?tab=artifacts', {
        scroll: false,
      });
    });

    test('navigates to the log tab with the correct line number when a method is clicked', async () => {
      const runDetailsDeferred = setup<any>();
      const runArtifactsDeferred = setup<any[]>();
      const runLogDeferred = setup<string>();

      render(
        <TestRunDetails
          runId={runId}
          runDetailsPromise={runDetailsDeferred.promise}
          runArtifactsPromise={runArtifactsDeferred.promise}
          runLogPromise={runLogDeferred.promise}
        />
      );

      // Resolve promises to load the component's data
      await act(async () => {
        runDetailsDeferred.resolve({
          testStructure: mockTestStructure,
        });
        runArtifactsDeferred.resolve([{ path: '/logs/debug.log' }]);
        runLogDeferred.resolve('Log content');
      });
      await screen.findByText('title:TestRun');

      // Navigate to the methods tab
      const methodsTabButton = screen.getByRole('tab', { name: 'tabs.methods' });
      fireEvent.click(methodsTabButton);

      // Find and click the specific mock button inside our mocked MethodsTab
      const mockMethod = screen.getByTestId('mock-method-button');
      fireEvent.click(mockMethod);

      // Assert that the router was called with the correct URL
      const logTabIndex = TEST_RUN_PAGE_TABS.indexOf('runLog');
      const expectedTabParam = `tab=${TEST_RUN_PAGE_TABS[logTabIndex]}`;
      const expectedLineParam = `line=123`;

      expect(mockRouter.replace).toHaveBeenCalledTimes(2); // 1st for tab change, 2nd for method click
      expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining(expectedTabParam), {
        scroll: false,
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining(expectedLineParam), {
        scroll: false,
      });

      const expectedUrl = `/test-runs/some-run-id?${expectedTabParam}&${expectedLineParam}`;
      expect(mockRouter.replace).toHaveBeenLastCalledWith(expectedUrl, { scroll: false });
    });
  });
});
