/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { fetchAllTestRunsByPaging } from '@/utils/testRuns';

import { ResultArchiveStoreAPIApi, Run } from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';

// This mock will simulate the API client's method
const mockGetRasSearchRuns = jest.fn();

// Mock the API client library to return our mock implementation
jest.mock('@/generated/galasaapi', () => {
  const originalModule = jest.requireActual('@/generated/galasaapi');

  return {
    ...originalModule,
    ResultArchiveStoreAPIApi: jest.fn().mockImplementation(() => ({
      getRasSearchRuns: mockGetRasSearchRuns,
    })),
  };
});

// Mock the utility that creates API configuration
jest.mock('@/utils/api', () => ({
  createAuthenticatedApiConfiguration: jest.fn(),
}));

// Mock constants to control test behavior predictably
jest.mock('@/utils/constants/common', () => ({
  CLIENT_API_VERSION: 'test-version',
  MAX_DISPLAYABLE_TEST_RUNS: 10,
  BATCH_SIZE: 4,
}));

jest.mock('next-intl', () => ({
  // Mock the useTranslations hook
  useTranslations: () => (key: string) => key,
  // Mock any other exports from next-intl that components might use
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('fetchAllTestRunsByPaging Function', () => {
  const fromDate = new Date('2023-10-26T00:00:00.000Z');
  const toDate = new Date('2023-10-27T00:00:00.000Z');
  const createMockRun = (id: number): Run => ({ runId: `run-${id}` });

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks before each test
    mockGetRasSearchRuns.mockClear();
    (ResultArchiveStoreAPIApi as jest.Mock).mockClear();
    (createAuthenticatedApiConfiguration as jest.Mock).mockClear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should fetch a single page of runs when results are less than BATCH_SIZE', async () => {
    // Arrange
    const mockRuns = [createMockRun(1), createMockRun(2)];
    mockGetRasSearchRuns.mockResolvedValue({ runs: mockRuns, nextCursor: null });

    // Act
    const result = await fetchAllTestRunsByPaging({ fromDate, toDate });

    // Assert
    expect(result.runs).toEqual(mockRuns);
    expect(result.limitExceeded).toBe(false);
    expect(mockGetRasSearchRuns).toHaveBeenCalledTimes(1);
    expect(mockGetRasSearchRuns).toHaveBeenCalledWith(
      'from:desc',
      'test-version',
      undefined,
      undefined,
      undefined,
      undefined,
      new Date('2023-10-26T00:00:00.000Z'),
      new Date('2023-10-27T00:00:00.000Z'),
      undefined,
      undefined,
      4,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'true',
      undefined
    );
  });

  test('should fetch and concatenate multiple pages of runs', async () => {
    // Arrange
    const mockRunsPage1 = [createMockRun(1), createMockRun(2), createMockRun(3), createMockRun(4)];
    const mockRunsPage2 = [createMockRun(5), createMockRun(6)];
    mockGetRasSearchRuns
      .mockResolvedValueOnce({ runs: mockRunsPage1, nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ runs: mockRunsPage2, nextCursor: null });

    // Act
    const result = await fetchAllTestRunsByPaging({ fromDate, toDate });

    // Assert
    expect(result.runs).toEqual([...mockRunsPage1, ...mockRunsPage2]);
    expect(result.limitExceeded).toBe(false);
    expect(mockGetRasSearchRuns).toHaveBeenCalledTimes(2);
  });

  test('should stop fetching when MAX_DISPLAYABLE_TEST_RUNS is reached and trim results', async () => {
    const page1Runs = [createMockRun(1), createMockRun(2), createMockRun(3), createMockRun(4)];
    const page2Runs = [createMockRun(5), createMockRun(6), createMockRun(7), createMockRun(8)];
    const page3Runs = [createMockRun(9), createMockRun(10), createMockRun(11), createMockRun(12)];

    mockGetRasSearchRuns
      .mockResolvedValueOnce({ runs: page1Runs, nextCursor: 'cursor1' })
      .mockResolvedValueOnce({ runs: page2Runs, nextCursor: 'cursor2' })
      .mockResolvedValueOnce({ runs: page3Runs, nextCursor: 'cursor3' });

    const result = await fetchAllTestRunsByPaging({ fromDate, toDate });

    expect(result.runs.length).toBe(10);
    expect(result.limitExceeded).toBe(true);
    expect(mockGetRasSearchRuns).toHaveBeenCalledTimes(3);
  });

  test('should handle API errors gracefully and return empty data', async () => {
    const apiError = new Error('API Failure');
    mockGetRasSearchRuns.mockRejectedValue(apiError);

    const result = await fetchAllTestRunsByPaging({ fromDate, toDate });

    expect(result.runs).toEqual([]);
    expect(result.limitExceeded).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching test runs:', apiError);
  });
});
