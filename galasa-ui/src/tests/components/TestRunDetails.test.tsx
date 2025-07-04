/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import TestRunDetails from '@/components/test-runs/TestRunDetails';

function setup<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Mock sessionStorage
const sessonStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    setItem(key: string, value: string) {
      store[key] = value;
    },
    getItem(key: string) {
      return store[key] || null;
    }, 
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessonStorageMock,
  writable: true,
});

// Mocking next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: any) =>
    opts?.runName ? `title:${opts.runName}` : key,
}));

jest.mock('@/components/common/BreadCrumb', () => {
  const BreadCrumb = ({ breadCrumbItems }: { breadCrumbItems: any[] }) => {
    const testRunsItem = breadCrumbItems.find(
      (item) => item.title === 'testRuns'
    );
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
  const PageTile = ({ translationKey }: any) => (
    <h1 data-testid="pagetile">{translationKey}</h1>
  );
  PageTile.displayName = 'PageTile';
  return {
    __esModule: true,
    default: PageTile,
  };
});

jest.mock('@/components/test-runs/OverviewTab', () => {
  const OverviewTab = ({ metadata }: any) => (
    <div>OverviewTab result={metadata?.result}</div>
  );
  OverviewTab.displayName = 'OverviewTab';
  return {
    __esModule: true,
    default: OverviewTab,
  };
});

jest.mock('@/components/test-runs/MethodsTab', () => {
  const MethodsTab = ({ methods }: any) => (
    <div>MethodsTab count={methods?.length}</div>
  );
  MethodsTab.displayName = 'MethodsTab';
  return {
    __esModule: true,
    default: MethodsTab,
  };
});

jest.mock('@/components/test-runs/LogTab', () => {
  const LogTab = ({ logs }: any) => <div>LogTab logs={logs}</div>;
  LogTab.displayName = 'LogTab';
  return {
    __esModule: true,
    default: LogTab,
  };
});

jest.mock('@/components/test-runs/ArtifactsTab', () => {
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

jest.mock('@/components/test-runs/TestRunSkeleton', () => {
  const TestRunSkeleton = () => <div>Skeleton</div>;
  TestRunSkeleton.displayName = 'TestRunSkeleton';
  return {
    __esModule: true,
    default: TestRunSkeleton,
  };
});

jest.mock('@/components/common/StatusIndicator', () => {
  const StatusIndicator = ({ status }: any) => (
    <span>StatusIndicator:{status}</span>
  );
  StatusIndicator.displayName = 'StatusIndicator';
  return {
    __esModule: true,
    default: StatusIndicator,
  };
});

// Carbon React mocks
jest.mock('@carbon/react', () => {
  const Tab = ({ children }: any) => <div>{children}</div>;
  const Tabs = ({ children }: any) => <div>{children}</div>;
  const TabList = ({ children }: any) => <div>{children}</div>;
  const TabPanels = ({ children }: any) => <div>{children}</div>;
  const TabPanel = ({ children }: any) => <div>{children}</div>;
  const Loading = () => <div>Loading</div>;

  [Tab, Tabs, TabList, TabPanels, TabPanel, Loading].forEach(c => {
    // @ts-ignore
    // Assigning displayName to function components for better debugging in React DevTools.
    // TypeScript does not allow this by default, so we suppress the error.
    c.displayName = c.name || 'Anonymous';
  });

  return { Tab, Tabs, TabList, TabPanels, TabPanel, Loading };
});

describe('TestRunDetails', () => {
  const runId = 'run-123';

  beforeEach(() => {
    sessonStorageMock.clear();
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
      screen.getByText(
        `ArtifactsTab count=2 runName=MyRun runId=${runId}`
      )
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

  it('build savedQuery from the sessionStorage and clears it', async () => {
    const runDetailsDeferred = setup<any>();
    const runArtifactsDeferred = setup<any[]>();
    const runLogDeferred = setup<string>();

    // Set a query string in sessionStorage
    const queryString = 'status=Finished&result=Success';
    sessionStorage.setItem('testRunsQuery', queryString);

    // Verify it is set correctly
    expect(sessionStorage.getItem('testRunsQuery')).toBe(queryString);

    render(
      <TestRunDetails
        runId={runId}
        runDetailsPromise={runDetailsDeferred.promise}
        runArtifactsPromise={runArtifactsDeferred.promise}
        runLogPromise={runLogDeferred.promise}
      />
    );

    // Check the breadcrumb props
    const breadcrumb = screen.getByTestId('breadcrumb');

    // Check if the link is correc
    expect(breadcrumb).toHaveAttribute('data-route', `/test-runs?${queryString}`);

    // Resolve the promises to ensure the component loads correctly
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

    // Final check to ensure breadcrumb still has the correct route after loading
    expect(breadcrumb).toHaveAttribute('data-route', `/test-runs?${queryString}`);
  });

});
