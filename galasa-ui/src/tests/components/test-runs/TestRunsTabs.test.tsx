/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TestRunsTabs from '@/components/test-runs/TestRunsTabs';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { decodeStateFromUrlParam } from '@/utils/encoding/urlEncoder';
import { TestRunsQueryParamsProvider } from '@/contexts/TestRunsQueryParamsContext';
import { SavedQueriesProvider } from '@/contexts/SavedQueriesContext';

// Mock Child Components
const TestRunsTableMock = jest.fn((props) => (
  <div>
    <div data-testid="test-runs-table">Mocked Test Runs Table</div>
    {props.runsList.forEach((run: any) => {
      const runId = run.id;
      return <div key={runId}>{run.runName || runId}</div>;
    })}
  </div>
));

jest.mock('@/components/test-runs/results/TestRunsTable', () => ({
  __esModule: true,
  default: (props: any) => TestRunsTableMock(props),
}));

jest.mock('@/components/test-runs/timeframe/TimeFrameContent', () => ({
  __esModule: true,
  default: () => <div>Mocked Timeframe Content</div>,
  calculateSynchronizedState: jest.fn((fromDate, toDate) => {
    const DAY_MS_MOCK = 86400000;
    const HOUR_MS_MOCK = 3600000;
    const MINUTE_MS_MOCK = 60000;

    const diff = toDate.getTime() - fromDate.getTime();
    const roundedDiff = Math.round(diff / 1000) * 1000;

    const durationDays = Math.floor(roundedDiff / DAY_MS_MOCK);
    const remainderHours = roundedDiff % DAY_MS_MOCK;
    const durationHours = Math.floor(remainderHours / HOUR_MS_MOCK);
    const remainderMinutes = remainderHours % HOUR_MS_MOCK;
    const durationMinutes = Math.floor(remainderMinutes / MINUTE_MS_MOCK);

    return {
      fromDate,
      toDate,
      fromTime: '00:00',
      fromAmPm: 'AM',
      toTime: '23:59',
      toAmPm: 'PM',
      durationDays,
      durationHours,
      durationMinutes,
    };
  }),
}));

jest.mock('@/components/test-runs/search-criteria/SearchCriteriaContent', () => ({
  __esModule: true,
  default: () => <div>Mocked Search Criteria Content</div>,
}));

jest.mock('@/components/test-runs/graph/TestRunsGraph', () => ({
  __esModule: true,
  default: jest.fn(() => <div>TestRunsGraphMock</div>),
}));

let capturedSetSelectedVisibleColumns: (columns: string[]) => void;
let capturedSetColumnsOrder: (order: { id: string; columnName: string }[]) => void;
let capturedSetSortOrder: (sortOrder: { id: string; order: 'asc' | 'desc' | 'none' }[]) => void;

jest.mock('@/components/test-runs/table-design/TableDesignContent', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedSetSelectedVisibleColumns = props.setSelectedRowIds;
    capturedSetColumnsOrder = props.setTableRows;
    capturedSetSortOrder = props.setSortOrder;
    return <div>Mocked Table Design Content</div>;
  },
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'tabs.timeframe': 'Timeframe',
      'tabs.tableDesign': 'Table Design',
      'tabs.searchCriteria': 'Search Criteria',
      'tabs.results': 'Results',
    };
    return translations[key] || key;
  },
}));

const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => '/test-runs',
}));

// Mock the useDateTimeFormat context
const mockGetResolvedTimeZone = jest.fn(() => 'UTC');
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => ({
    formatDate: (date: Date) => date.toLocaleString(),
    getResolvedTimeZone: mockGetResolvedTimeZone,
  }),
}));

jest.mock('@/utils/constants/common', () => ({
  ...jest.requireActual('@/utils/constants/common'),
  RESULTS_TABLE_COLUMNS: [
    { id: 'submittedAt', columnName: 'Submitted' },
    { id: 'runName', columnName: 'Test Run Name' },
    { id: 'requestor', columnName: 'Requestor' },
    { id: 'testName', columnName: 'Test Name' },
    { id: 'status', columnName: 'Status' },
    { id: 'result', columnName: 'Result' },
    { id: 'tags', columnName: 'Tags' },
  ],
  COLUMNS_IDS: {
    SUBMITTED_AT: 'submittedAt',
    TEST_RUN_NAME: 'runName',
    REQUESTOR: 'requestor',
    TEST_NAME: 'testName',
    STATUS: 'status',
    RESULT: 'result',
    TAGS: 'tags',
  },
  TEST_RUNS_QUERY_PARAMS: {
    FROM: 'from',
    TO: 'to',
    RUN_NAME: 'runName',
    REQUESTOR: 'requestor',
    GROUP: 'group',
    SUBMISSION_ID: 'submissionId',
    BUNDLE: 'bundle',
    TEST_NAME: 'testName',
    RESULT: 'result',
    STATUS: 'status',
    TAGS: 'tags',
    VISIBLE_COLUMNS: 'visibleColumns',
    COLUMNS_ORDER: 'columnsOrder',
    TAB: 'tab',
    SORT_ORDER: 'sortOrder',
    DURATION: 'duration',
  },
  DAY_MS: 86400000,
  TABS_IDS: ['timeframe', 'table-design', 'search-criteria', 'results'],
  SEARCH_CRITERIA_KEYS: [
    'runName',
    'requestor',
    'group',
    'submissionId',
    'bundle',
    'testName',
    'result',
    'status',
    'tags',
  ],
  TEST_RUNS_STATUS: {
    QUEUED: 'Queued',
    STARTED: 'Started',
    GENERATING: 'Generating',
    BUILDING: 'Building',
    PROVSTART: 'Provstart',
    RUNNING: 'Running',
    RUNDONE: 'Rundone',
    ENDING: 'Ending',
    FINISHED: 'Finished',
  },
  DEFAULT_VISIBLE_COLUMNS: ['submittedAt', 'runName', 'requestor', 'testName', 'status', 'result'],
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ runs: [], limitExceeded: false }),
  })
) as jest.Mock;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Turn off retries for tests to make them run faster
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <SavedQueriesProvider>
      <TestRunsQueryParamsProvider>{children}</TestRunsQueryParamsProvider>
    </SavedQueriesProvider>
  </QueryClientProvider>
);

describe('TestRunsTabs Component', () => {
  const STABLE_DATE = new Date('2024-07-15T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(STABLE_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const mockRequestorNamesPromise = Promise.resolve([]);
  const mockResultsNamesPromise = Promise.resolve([]);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    queryClient.clear();
  });

  test('renders all tabs correctly', () => {
    render(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>,
      { wrapper }
    );
    const tabLabels = ['Timeframe', 'Table Design', 'Search Criteria', 'Results'];
    tabLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('displays the content of the Timeframe tab', () => {
    render(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>,
      { wrapper }
    );
    const timeframeTab = screen.getByRole('tab', { name: 'Timeframe' });
    fireEvent.click(timeframeTab);

    expect(timeframeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Mocked Timeframe Content')).toBeVisible();
  });

  test('switches to the "Results" tab and displays its content on click', async () => {
    render(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>,
      { wrapper }
    );
    const resultsTab = screen.getByRole('tab', { name: 'Results' });
    fireEvent.click(resultsTab);

    expect(resultsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('test-runs-table')).toBeVisible();
  });

  describe('URL State Management', () => {
    test('loads state from URL parameters on initial render with sorted values', async () => {
      // Arrange: Provide specific URL parameters for this test
      const params = new URLSearchParams();
      params.set('visibleColumns', 'status,result');
      params.set('columnsOrder', 'result,status,testName');
      mockUseSearchParams.mockReturnValue(params);

      // Act
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Assert: Wait for the component to process the params and pass them as props
      await waitFor(() => {
        expect(TestRunsTableMock).toHaveBeenCalledWith(
          expect.objectContaining({
            visibleColumns: ['result', 'status'],
            orderedHeaders: [
              { id: 'result', columnName: 'Result' },
              { id: 'status', columnName: 'Status' },
              { id: 'testName', columnName: 'Test Name' },
            ],
          })
        );
      });
    });

    test('saves default state to URL when no parameters are present', async () => {
      // Act
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Assert: Wait for the initialization and save effect to run
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const urlCall = mockReplace.mock.calls[0][0];
      const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');

      const decoded = decodeStateFromUrlParam(encodedQuery!);
      const decodedParams = new URLSearchParams(decoded!);

      expect(decodedParams.get('tab')).toBe('results');
      // Visible Columns must be sorted
      expect(decodedParams.get('visibleColumns')).toBe(
        'requestor,result,runName,status,submittedAt,testName'
      );
      expect(decodedParams.get('columnsOrder')).toBe(
        'submittedAt,runName,requestor,testName,status,result,tags'
      );
      expect(decodedParams.get('duration')).toBe('1,0,0'); // 1 day
    });

    test('updates URL when selected visible columns are changed', async () => {
      // Arrange
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for initial render and effect
      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
      mockReplace.mockClear();

      // Act
      fireEvent.click(screen.getByText('Table Design'));

      // Assert
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const urlCall = mockReplace.mock.calls[0][0];
      const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');

      // We must decode the received query to check its contents
      const decoded = decodeStateFromUrlParam(encodedQuery!);
      const decodedParams = new URLSearchParams(decoded!);

      // The only thing that should change is the tab
      expect(decodedParams.get('tab')).toBe('table-design');
      // All other params should remain at their default values
      expect(decodedParams.get('visibleColumns')).toBe(
        'requestor,result,runName,status,submittedAt,testName'
      );
      expect(decodedParams.get('columnsOrder')).toBe(
        'submittedAt,runName,requestor,testName,status,result,tags'
      );
    });

    test('updates URL when column order is changed', async () => {
      // Arrange
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      mockReplace.mockClear();

      // Act: Simulate a child component updating the state
      const newOrder = [
        { id: 'result', columnName: 'Result' },
        { id: 'status', columnName: 'Status' },
      ];
      act(() => {
        if (capturedSetColumnsOrder) {
          capturedSetColumnsOrder(newOrder);
        }
      });

      // Assert: Wait for the effect to run with the new state
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

      const urlCall = mockReplace.mock.calls[0][0];
      const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');
      const decoded = decodeStateFromUrlParam(encodedQuery!);
      const decodedParams = new URLSearchParams(decoded!);

      expect(decodedParams.get('columnsOrder')).toBe('result,status');
      // Visible columns should be sorted with the same previous values
      expect(decodedParams.get('visibleColumns')).toBe(
        'requestor,result,runName,status,submittedAt,testName'
      );
    });

    test('clear visible columns in URL when none are selected', async () => {
      // Arrange
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      mockReplace.mockClear();

      // Act: Simulate a child component clearing the visible columns
      act(() => {
        capturedSetSelectedVisibleColumns([]);
      });

      // Assert: The save-to-URL effect runs again with the new state
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

      const urlCall = mockReplace.mock.calls[0][0];
      const params = new URLSearchParams(urlCall.split('?')[1]);
      expect(params.get('visibleColumns')).toBeNull();
    });

    test('updates URL when sort order is changed', async () => {
      // Arrange
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      mockReplace.mockClear();

      // Act: Simulate a child component updating the sort order
      act(() => {
        capturedSetSortOrder([
          { id: 'status', order: 'asc' },
          { id: 'result', order: 'desc' },
        ]);
      });

      // Assert: The save-to-URL effect runs again with the new state
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

      const urlCall = mockReplace.mock.calls[0][0];
      const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');
      const decoded = decodeStateFromUrlParam(encodedQuery!);
      const decodedParams = new URLSearchParams(decoded!);

      expect(decodedParams.get('sortOrder')).toBe('status:asc,result:desc');
    });

    test('clear sortOrder in URL when no certain order is specified', async () => {
      // Arrange
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
      mockReplace.mockClear();

      // Act: Simulate a child component clearing the visible columns
      act(() => {
        capturedSetSortOrder([]);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const urlCall = mockReplace.mock.calls[0][0];

        const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');
        const decoded = decodeStateFromUrlParam(encodedQuery!);
        const newParams = new URLSearchParams(decoded!);

        expect(newParams.get('sortOrder')).toBeNull();
      });
    });

    test('initialize sortOrder state from URL parameter', async () => {
      // Arrange: Provide specific URL parameters for this test
      const params = new URLSearchParams();
      params.set('sortOrder', 'status:asc,result:desc');
      mockUseSearchParams.mockReturnValue(params);

      // Act
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Assert: Wait for the component to process the params and pass them as props
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const urlCall = mockReplace.mock.calls[0][0];

        // Decode the URL parameters to check the sortOrder
        const encodedQuery = new URLSearchParams(urlCall.split('?')[1]).get('q');
        const decoded = decodeStateFromUrlParam(encodedQuery!);
        const newParams = new URLSearchParams(decoded!);

        expect(newParams.get('sortOrder')).toBe('status:asc,result:desc');
      });
    });

    describe('URL State for Duration', () => {
      test('initializes from "duration" param and uses it for API call', async () => {
        // Create a URL with duration parameter
        const params = new URLSearchParams();
        params.set('duration', '1,2,30'); // 1 day, 2 hours, 30 minutes
        mockUseSearchParams.mockReturnValue(params);

        // Act
        render(
          <FeatureFlagProvider>
            <TestRunsTabs
              requestorNamesPromise={mockRequestorNamesPromise}
              resultsNamesPromise={mockResultsNamesPromise}
            />
          </FeatureFlagProvider>,
          { wrapper }
        );

        // Trigger API call by switching to the results tab
        fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

        // Assert
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        const fetchParams = new URLSearchParams(fetchUrl.split('?')[1]);

        // The API call should use the 'duration' parameter directly from the URL
        expect(fetchParams.get('duration')).toBe('1,2,30');
        // The 'from' and 'to' params should not be present when 'duration' is used
        expect(fetchParams.has('from')).toBe(false);
        expect(fetchParams.has('to')).toBe(false);
      });
    });
  });

  describe('Data Fetching with useQuery', () => {
    beforeEach(() => {
      // Clear call history for fetch before each test
      (global.fetch as jest.Mock).mockClear();
      queryClient.clear();
    });

    test('fetches data on initial render as "Results" tab is active', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      expect(global.fetch).toHaveBeenCalled();
    });

    test('fetches data when "Results" tab is selected', async () => {
      const params = new URLSearchParams('tab=timeframe&visibleColumns=requestor');
      mockUseSearchParams.mockReturnValue(params);

      (global.fetch as jest.Mock).mockClear();

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Wait for initialization to complete
      await waitFor(() => {
        const timeframeTab = screen.getByRole('tab', { name: 'Timeframe' });
        expect(timeframeTab).toHaveAttribute('aria-selected', 'true');
      });

      // Verify no fetch has been called while on timeframe tab
      expect(global.fetch).not.toHaveBeenCalled();

      // Click the Results tab
      const resultsTab = screen.getByRole('tab', { name: 'Results' });
      fireEvent.click(resultsTab);

      // Now verify the fetch is called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    test('serves data from cache and does not refetch when switching tabs with same query', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('requestor=user1&result=passed'));
      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Initial fetch
      const resultsTab = screen.getByRole('tab', { name: 'Results' });
      fireEvent.click(resultsTab);
      await waitFor(() => expect(resultsTab).toHaveAttribute('aria-selected', 'true'));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

      // Switch to another tab and back
      const timeFrameTab = screen.getByRole('tab', { name: 'Timeframe' });
      fireEvent.click(timeFrameTab);
      await waitFor(() => expect(timeFrameTab).toHaveAttribute('aria-selected', 'true'));

      fireEvent.click(resultsTab);
      await waitFor(() => expect(resultsTab).toHaveAttribute('aria-selected', 'true'));
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('does NOT trigger a new fetch when a UI-only param changes', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('requestor=user1&result=passed'));
      const { rerender } = render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );

      // Initial fetch
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

      // Change a UI-only param (e.g., visibleColumns)
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('requestor=user1&result=passed&visibleColumns=status,result')
      );
      rerender(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={mockRequestorNamesPromise}
            resultsNamesPromise={mockResultsNamesPromise}
          />
        </FeatureFlagProvider>
      );

      // Ensure no new fetch is triggered
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('check that we are sending an API request when we expect to', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('requestor=user1&result=passed'));
    const { rerender } = render(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>,
      { wrapper }
    );

    // Initial fetch
    fireEvent.click(screen.getByRole('tab', { name: 'Results' }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    // Change tags param
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('requestor=user1&result=passed&tags=tag1,tag2')
    );
    rerender(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>
    );
    // Ensure a new fetch is triggered
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    // Change the tags order without changing the tags themselves
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('requestor=user1&result=passed&tags=tag2,tag1')
    );
    rerender(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>
    );
    // Ensure no fetch is triggered
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalledTimes(3));

    // Delete a tag
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('requestor=user1&result=passed&tags=tag2')
    );
    rerender(
      <FeatureFlagProvider>
        <TestRunsTabs
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      </FeatureFlagProvider>
    );

    // Ensure a new fetch is triggered
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });

  describe('Sorting Logic', () => {
    const unsortedRuns = [
      {
        runId: '1',
        testStructure: { runName: 'C Run', status: 'Passed', requestor: 'A User', tags: ['A tag'] },
      },
      {
        runId: '2',
        testStructure: { runName: 'A Run', status: 'Failed', requestor: 'B User', tags: ['B tag'] },
      },
      {
        runId: '3',
        testStructure: {
          runName: 'B Run',
          status: 'Passed',
          requestor: 'C User',
          tags: ['A tag', 'C tag'],
        },
      },
      {
        runId: '0',
        testStructure: {
          runName: 'D Run',
          status: 'Passed',
          requestor: 'A User',
          tags: ['D tag', 'A tag'],
        },
      },
    ];

    const defaultTransformedRun = {
      bundle: 'N/A',
      group: 'N/A',
      package: 'N/A',
      result: 'N/A',
      submissionId: 'N/A',
      submittedAt: 'N/A',
      testName: 'N/A',
      runName: 'N/A',
      testShortName: 'N/A',
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ runs: unsortedRuns, limitExceeded: false }),
        })
      );
    });

    test('sorts data by a single column in ascending order', async () => {
      const params = new URLSearchParams();
      params.set('sortOrder', 'runName:asc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];
        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '2',
            runName: 'A Run',
            status: 'Failed',
            requestor: 'B User',
            tags: 'B tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            runName: 'B Run',
            status: 'Passed',
            requestor: 'C User',
            tags: 'A tag, C tag',
          },
          {
            ...defaultTransformedRun,
            id: '1',
            runName: 'C Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'A tag',
          },
          {
            ...defaultTransformedRun,
            id: '0',
            runName: 'D Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'D tag, A tag',
          },
        ]);
      });
    });

    test('sorts data by a single column in descending order', async () => {
      const params = new URLSearchParams();
      params.set('sortOrder', 'runName:desc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];
        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '0',
            runName: 'D Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'D tag, A tag',
          },
          {
            ...defaultTransformedRun,
            id: '1',
            runName: 'C Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'A tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            runName: 'B Run',
            status: 'Passed',
            requestor: 'C User',
            tags: 'A tag, C tag',
          },
          {
            ...defaultTransformedRun,
            id: '2',
            runName: 'A Run',
            status: 'Failed',
            requestor: 'B User',
            tags: 'B tag',
          },
        ]);
      });
    });

    test('sorts by tags in ascending order', async () => {
      const params = new URLSearchParams();
      params.set('sortOrder', 'tags:asc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];
        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '1',
            runName: 'C Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'A tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            runName: 'B Run',
            status: 'Passed',
            requestor: 'C User',
            tags: 'A tag, C tag',
          },
          {
            ...defaultTransformedRun,
            id: '2',
            runName: 'A Run',
            status: 'Failed',
            requestor: 'B User',
            tags: 'B tag',
          },
          {
            ...defaultTransformedRun,
            id: '0',
            runName: 'D Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'D tag, A tag',
          },
        ]);
      });
    });

    test('sorts correctly with two keys where primary key has higher column order', async () => {
      const params = new URLSearchParams();
      params.set('columnsOrder', 'requestor,testName,runName,result,tags');
      params.set('sortOrder', 'runName:desc,requestor:asc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];
        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '0',
            runName: 'D Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'D tag, A tag',
          },
          {
            ...defaultTransformedRun,
            id: '1',
            runName: 'C Run',
            status: 'Passed',
            requestor: 'A User',
            tags: 'A tag',
          },
          {
            ...defaultTransformedRun,
            id: '2',
            runName: 'A Run',
            status: 'Failed',
            requestor: 'B User',
            tags: 'B tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            runName: 'B Run',
            status: 'Passed',
            requestor: 'C User',
            tags: 'A tag, C tag',
          },
        ]);
      });
    });

    test('sorts by date in ascending order', async () => {
      const mockedRuns = [
        {
          runId: '1',
          testStructure: {
            queued: '2023-10-11T12:00:00Z',
            runName: 'Run A',
            status: 'Passed',
            requestor: 'A User',
            tags: ['A tag'],
          },
        },
        {
          runId: '2',
          testStructure: {
            queued: '2023-10-02T12:00:00Z',
            runName: 'Run B',
            status: 'Failed',
            requestor: 'B User',
            tags: ['B tag'],
          },
        },
        {
          runId: '3',
          testStructure: {
            queued: '2023-10-03T12:00:00Z',
            runName: 'Run C',
            status: 'Passed',
            requestor: 'C User',
            tags: ['C tag'],
          },
        },
      ];

      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ runs: mockedRuns, limitExceeded: false }),
        })
      );

      const params = new URLSearchParams();
      params.set('sortOrder', 'submittedAt:asc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];

        const expectedDateRun2 = '2023-10-02T12:00:00Z';
        const expectedDateRun3 = '2023-10-03T12:00:00Z';
        const expectedDateRun1 = '2023-10-11T12:00:00Z';

        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '2',
            submittedAt: expectedDateRun2,
            runName: 'Run B',
            status: 'Failed',
            requestor: 'B User',
            tags: 'B tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            submittedAt: expectedDateRun3,
            runName: 'Run C',
            status: 'Passed',
            requestor: 'C User',
            tags: 'C tag',
          },
          {
            ...defaultTransformedRun,
            id: '1',
            submittedAt: expectedDateRun1,
            runName: 'Run A',
            status: 'Passed',
            requestor: 'A User',
            tags: 'A tag',
          },
        ]);
      });
    });

    test('sorts correctly with three keys and handles ties at each level', async () => {
      const mockedRuns = [
        { runId: '1', testStructure: { requestor: 'A User', status: 'Passed', tags: ['B tag'] } },
        { runId: '2', testStructure: { requestor: 'L User', status: 'Passed', tags: ['C tag'] } },
        { runId: '3', testStructure: { requestor: 'B User', status: 'Passed', tags: ['A tag'] } },
        { runId: '4', testStructure: { requestor: 'L User', status: 'Failed', tags: ['F tag'] } },
        {
          runId: '5',
          testStructure: { requestor: 'A User', status: 'Passed', tags: ['A tag, L tag'] },
        },
        {
          runId: '6',
          testStructure: { requestor: 'A User', status: 'Failed', tags: ['A tag, B tag'] },
        },
      ];

      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ runs: mockedRuns, limitExceeded: false }),
        })
      );

      const params = new URLSearchParams();
      params.set('columnsOrder', 'requestor,status,runName,result,tags');
      params.set('sortOrder', 'requestor:desc,tags:asc,status:asc');
      mockUseSearchParams.mockReturnValue(params);

      render(
        <FeatureFlagProvider>
          <TestRunsTabs
            requestorNamesPromise={Promise.resolve([])}
            resultsNamesPromise={Promise.resolve([])}
          />
        </FeatureFlagProvider>,
        { wrapper }
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Results' }));

      await waitFor(() => {
        const lastCallArgs = TestRunsTableMock.mock.calls.slice(-1)[0][0];
        expect(lastCallArgs.runsList).toEqual([
          {
            ...defaultTransformedRun,
            id: '4',
            requestor: 'L User',
            status: 'Failed',
            tags: 'F tag',
          },
          {
            ...defaultTransformedRun,
            id: '2',
            requestor: 'L User',
            status: 'Passed',
            tags: 'C tag',
          },
          {
            ...defaultTransformedRun,
            id: '3',
            requestor: 'B User',
            status: 'Passed',
            tags: 'A tag',
          },
          {
            ...defaultTransformedRun,
            id: '6',
            requestor: 'A User',
            status: 'Failed',
            tags: 'A tag, B tag',
          },
          {
            ...defaultTransformedRun,
            id: '5',
            requestor: 'A User',
            status: 'Passed',
            tags: 'A tag, L tag',
          },
          {
            ...defaultTransformedRun,
            id: '1',
            requestor: 'A User',
            status: 'Passed',
            tags: 'B tag',
          },
        ]);
      });
    });
  });
});
