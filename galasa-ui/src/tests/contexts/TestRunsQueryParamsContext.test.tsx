/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {
  TestRunsQueryParamsProvider,
  useTestRunsQueryParams,
} from '@/contexts/TestRunsQueryParamsContext';
import {
  DEFAULT_VISIBLE_COLUMNS,
  RESULTS_TABLE_COLUMNS,
  TABS_IDS,
  TEST_RUNS_QUERY_PARAMS,
} from '@/utils/constants/common';
import { decodeStateFromUrlParam, encodeStateToUrlParam } from '@/utils/encoding/urlEncoder';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { calculateSynchronizedState } from '@/components/test-runs/timeframe/TimeFrameContent';

// Mock next/navigation
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/test-runs',
}));

// Mock contexts
const mockDateTimeFormat = {
  getResolvedTimeZone: () => 'UTC',
};
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => mockDateTimeFormat,
}));

const mockSavedQueries = {
  defaultQuery: { title: 'Default Query' },
};
jest.mock('@/contexts/SavedQueriesContext', () => ({
  useSavedQueries: () => mockSavedQueries,
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock a simple component to display the hook's state for our tests
const TestComponent = () => {
  const {
    selectedTabIndex,
    setSelectedTabIndex,
    timeframeValues,
    setTimeframeValues,
    searchCriteria,
    setSearchCriteria,
    selectedVisibleColumns,
    setSelectedVisibleColumns,
    sortOrder,
    setSortOrder,
    columnsOrder,
    setColumnsOrder,
    queryName,
    setQueryName,
  } = useTestRunsQueryParams();

  return (
    <div>
      <p>Timeframe Values: {JSON.stringify(timeframeValues)}</p>
      <p>TabIndex: {selectedTabIndex}</p>
      <p>TimeframeIsRelative: {timeframeValues.isRelativeToNow?.toString()}</p>
      <p>SearchCriteria: {JSON.stringify(searchCriteria)}</p>
      <p>VisibleColumns: {selectedVisibleColumns.sort().join(',')}</p>
      <p>SortOrder: {JSON.stringify(sortOrder)}</p>
      <p>
        ColumnsOrder:{' '}
        {columnsOrder
          .map((c) => c.id)
          .sort()
          .join(',')}
      </p>
      <p>QueryName: {queryName}</p>
      <p>TimeframeValues: {JSON.stringify(timeframeValues)}</p>

      {/*Buttons to trigger state changes*/}
      <button onClick={() => setSelectedTabIndex(1)}>Set Tab Index to 1</button>
      <button
        onClick={() => {
          const fromDate = new Date('2023-01-01T00:00:00.000Z');
          const toDate = new Date('2023-01-02T00:00:00.000Z');
          const newTimeframeState = calculateSynchronizedState(fromDate, toDate, 'UTC');
          setTimeframeValues({
            ...newTimeframeState,
            fromDate,
            toDate,
            isRelativeToNow: false,
          });
        }}
      >
        Set Absolute Time
      </button>
      <button onClick={() => setSearchCriteria({ name: 'NewSearch' })}>Set Search</button>
      <button onClick={() => setSelectedVisibleColumns(['runId', 'runName'])}>
        Set Visible Columns
      </button>
      <button onClick={() => setSortOrder([{ id: 'name', order: 'asc' }])}>Set Sort Order</button>
      <button onClick={() => setColumnsOrder([RESULTS_TABLE_COLUMNS[1], RESULTS_TABLE_COLUMNS[0]])}>
        Set Columns Order
      </button>
      <button onClick={() => setQueryName('My Custom Query')}>Set Query Name</button>
    </div>
  );
};

describe('TestRunsQueryParamsContext', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  describe('Initialization', () => {
    test('initializes with default values when no URL params are present', () => {
      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );

      expect(screen.getByText(`TabIndex: ${TABS_IDS.indexOf('results')}`)).toBeInTheDocument();
      expect(
        screen.getByText(`VisibleColumns: ${DEFAULT_VISIBLE_COLUMNS.sort().join(',')}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `ColumnsOrder: ${RESULTS_TABLE_COLUMNS.map((c) => c.id)
            .sort()
            .join(',')}`
        )
      ).toBeInTheDocument();
      expect(screen.getByText('TimeframeIsRelative: true')).toBeInTheDocument();
      expect(screen.getByText('SearchCriteria: {}')).toBeInTheDocument();
      expect(screen.getByText('SortOrder: []')).toBeInTheDocument();
      expect(screen.getByText('QueryName: Default Query')).toBeInTheDocument();
    });

    test('inializes state from a full set of URL params', () => {
      mockSearchParams = new URLSearchParams({
        [TEST_RUNS_QUERY_PARAMS.TAB]: 'timeframe',
        [TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS]: 'id,status',
        [TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER]: 'status,result,submissionId',
        [TEST_RUNS_QUERY_PARAMS.FROM]: '2023-10-01T00:00:00.000Z',
        [TEST_RUNS_QUERY_PARAMS.TO]: '2023-10-02T00:00:00.000Z',
        [TEST_RUNS_QUERY_PARAMS.SORT_ORDER]: 'status:desc',
        [TEST_RUNS_QUERY_PARAMS.RUN_NAME]: 'MyTestRun',
        [TEST_RUNS_QUERY_PARAMS.QUERY_NAME]: 'Saved Query 1',
      });

      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );

      expect(screen.getByText(`TabIndex: ${TABS_IDS.indexOf('timeframe')}`)).toBeInTheDocument();
      expect(screen.getByText('VisibleColumns: id,status')).toBeInTheDocument();
      expect(screen.getByText('ColumnsOrder: result,status,submissionId')).toBeInTheDocument();
      expect(screen.getByText('TimeframeIsRelative: false')).toBeInTheDocument();
      expect(screen.getByText('SearchCriteria: {"runName":"MyTestRun"}')).toBeInTheDocument();
      expect(screen.getByText('SortOrder: [{"id":"status","order":"desc"}]')).toBeInTheDocument();
      expect(screen.getByText('QueryName: Saved Query 1')).toBeInTheDocument();
    });

    test('initializes state from an encoded "q" URL param', () => {
      const params = new URLSearchParams({
        [TEST_RUNS_QUERY_PARAMS.TAB]: 'search-criteria',
        [TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS]: 'runId,status',
        [TEST_RUNS_QUERY_PARAMS.QUERY_NAME]: 'Encoded Query',
      });
      const encoded = encodeStateToUrlParam(params.toString());
      mockSearchParams = new URLSearchParams({ q: encoded });

      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );

      expect(
        screen.getByText(`TabIndex: ${TABS_IDS.indexOf('search-criteria')}`)
      ).toBeInTheDocument();
      expect(screen.getByText('VisibleColumns: runId,status')).toBeInTheDocument();
      expect(screen.getByText('QueryName: Encoded Query')).toBeInTheDocument();
    });

    test('falls back to default tab if URL tab param is invalid', () => {
      mockSearchParams = new URLSearchParams({ [TEST_RUNS_QUERY_PARAMS.TAB]: 'invalid-tab' });

      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );

      expect(screen.getByText(`TabIndex: ${TABS_IDS.indexOf('results')}`)).toBeInTheDocument();
    });

    test('initializes timeframe with relative duration', () => {
      mockSearchParams = new URLSearchParams({
        duration: '5,10,30', // 5 days, 10 hours, 30 minutes
      });

      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      expect(screen.getByText('TimeframeIsRelative: true')).toBeInTheDocument();
    });

    test('initializes timeframe with absolute dates', () => {
      mockSearchParams = new URLSearchParams({
        [TEST_RUNS_QUERY_PARAMS.FROM]: '2023-10-01T00:00:00.000Z',
        [TEST_RUNS_QUERY_PARAMS.TO]: '2023-10-02T00:00:00.000Z',
      });

      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      expect(screen.getByText('TimeframeIsRelative: false')).toBeInTheDocument();
      expect(
        screen.getByText(
          'TimeframeValues: {"fromDate":"2023-10-01T00:00:00.000Z","fromTime":"12:00","fromAmPm":"AM","toDate":"2023-10-02T00:00:00.000Z","toTime":"12:00","toAmPm":"AM","durationDays":1,"durationHours":0,"durationMinutes":0,"isRelativeToNow":false}'
        )
      ).toBeInTheDocument();
    });
  });

  describe('State Update and URL Synchronization', () => {
    let dateSpy: jest.SpyInstance;
    const mockNow = new Date('2024-01-01T10:00:00.000Z');
    const OriginalDate = global.Date;

    beforeEach(() => {
      dateSpy = jest.spyOn(global, 'Date').mockImplementation((...args) => {
        if (args.length > 0) {
          return new OriginalDate(...args);
        }
        return mockNow;
      });
    });

    afterEach(() => {
      dateSpy.mockRestore();
    });

    const waitForInitialization = async () => {
      await waitFor(() => {
        // Wait for the first URL write, which signifies the component has initialized.
        expect(mockReplace).toHaveBeenCalled();
      });
      // After initialization, clear the mock for the actual test assertion.
      mockReplace.mockClear();
    };

    const getDecodedParams = (url: string): URLSearchParams => {
      const search = new URLSearchParams(url.split('?')[1]);
      const decodedQueryString = decodeStateFromUrlParam(search.get('q') || '');
      return new URLSearchParams(decodedQueryString || '');
    };

    test('updates the URL when selectedTabIndex changes', async () => {
      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      await waitForInitialization();

      fireEvent.click(screen.getByRole('button', { name: 'Set Tab Index to 1' }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const url = mockReplace.mock.calls[0][0];
      const decodedQuery = getDecodedParams(url);
      expect(decodedQuery.get(TEST_RUNS_QUERY_PARAMS.TAB)).toBe(TABS_IDS[1]);
    });

    test('updates the URL when timeframeValues change to absolute', async () => {
      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      await waitForInitialization();

      fireEvent.click(screen.getByRole('button', { name: 'Set Absolute Time' }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const url = mockReplace.mock.calls[0][0];
      const decodedQuery = getDecodedParams(url);
      expect(decodedQuery.get(TEST_RUNS_QUERY_PARAMS.FROM)).toBe('2023-01-01T00:00:00.000Z');
      expect(decodedQuery.get(TEST_RUNS_QUERY_PARAMS.TO)).toBe('2023-01-02T00:00:00.000Z');
      expect(decodedQuery.has(TEST_RUNS_QUERY_PARAMS.DURATION)).toBe(false);
    });

    test('updates selected visible columns when changed', async () => {
      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      await waitForInitialization();

      fireEvent.click(screen.getByRole('button', { name: 'Set Visible Columns' }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const url = mockReplace.mock.calls[0][0];
      const decodedQuery = getDecodedParams(url);
      expect(decodedQuery.get(TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS)).toBe('runId,runName');
    });

    test('updates columns order when changed', async () => {
      render(
        <TestRunsQueryParamsProvider>
          <TestComponent />
        </TestRunsQueryParamsProvider>
      );
      await waitForInitialization();

      fireEvent.click(screen.getByRole('button', { name: 'Set Columns Order' }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      const url = mockReplace.mock.calls[0][0];
      const decodedQuery = getDecodedParams(url);
      expect(decodedQuery.get(TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER)).toBe(
        `${RESULTS_TABLE_COLUMNS[1].id},${RESULTS_TABLE_COLUMNS[0].id}`
      );
    });
  });
});
