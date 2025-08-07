/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import TestRunsTable from '@/components/test-runs/TestRunsTable';
import { MAX_DISPLAYABLE_TEST_RUNS, RESULTS_TABLE_COLUMNS } from '@/utils/constants/common';
import { useSearchParams, useRouter } from 'next/navigation';

const mockRouterPush = jest.fn();
jest.mock('next/navigation');

const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

// Mock the useHistoryBreadCrumbs hook to return a mock history breadcrumbs.
const pushBreadCrumbMock = jest.fn();
jest.mock('@/hooks/useHistoryBreadCrumbs', () => ({
  __esModule: true,
  default: () => ({
    pushBreadCrumb: pushBreadCrumbMock,
    resetBreadCrumbs: jest.fn(),
  }),
}));

// Mock the useDateTimeFormat context
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => ({
    formatDate: (date: Date) => date.toLocaleString(),
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'timeFrameText.range': 'Showing test runs submitted between {from} and {to}',
      'timeFrameText.default': 'Showing test runs',
      'pagination.forwardText': 'Next page',
      'pagination.backwardText': 'Previous page',
      'pagination.itemsPerPageText': 'Items per page:',
      'pagination.items': 'items',
      'pagination.pages': 'pages',
      'pagination.pageNumberText': 'Page number',
      'pagination.of': 'of {total}',
      noColumnsSelected:
        'All of the columns have been hidden in the table design tab, so no result details will be visible.',
      noTestRunsFound: 'No test runs were found for the selected timeframe',
      isloading: 'Loading...',
      submittedAt: 'Submitted at',
      runName: 'Test Run name',
      requestor: 'Requestor',
      testName: 'Test Name',
      status: 'Status',
      result: 'Result',

      limitExceededSubtitle:
        'Your query returned more than {maxRecords} results. To avoid this in the future narrow your time frame or change your search criteria to return fewer results.',
    };

    let text = translations[key] || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  },
}));

jest.mock(
  '@/app/error/page',
  () =>
    function MockErrorPage() {
      return <div data-testid="error-page">Error Occurred</div>;
    }
);

jest.mock(
  '@/components/common/StatusIndicator',
  () =>
    function StatusIndicator({ status }: { status: string }) {
      return <div data-testid="status-indicator">Status: {status}</div>;
    }
);

// Helper function to generate mock test runs data
const generateMockRuns = (count: number) => {
  return Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    return {
      id: `${i}`,
      runName: `Test Run ${i}`,
      requestor: `user${i}`,
      group: `group${i}`,
      bundle: `bundle${i}`,
      package: `package${i}`,
      testName: `test${i}`,
      status: 'finished',
      result: i % 2 === 0 ? 'Failed' : 'Passed',
      submittedAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
      tags: `tag${i}`,
      submissionId: `submission${i}`,
    };
  });
};

// Default props for TestRunsTable component
const defaultProps = {
  visibleColumns: ['submittedAt', 'runName', 'requestor', 'testName', 'status', 'result'],
  orderedHeaders: RESULTS_TABLE_COLUMNS,
  limitExceeded: false,
  isLoading: false,
  isError: false,
};

describe('TestRunsTable Component', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    // Suppress console.error for rejected promise tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
    pushBreadCrumbMock.mockClear();
  });

  describe('Rendering Logic', () => {
    test('shows loading state when isLoading is true', async () => {
      // Act
      render(<TestRunsTable runsList={[]} {...defaultProps} isLoading={true} isError={false} />);

      // Assert: Check if the loading state is displayed
      expect(screen.getByTestId('loading-table-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Test Run 1')).not.toBeInTheDocument();
    });
  });

  test('displays table with data when loading is complete', () => {
    const mockRuns = generateMockRuns(2);
    render(
      <TestRunsTable runsList={mockRuns} {...defaultProps} isLoading={false} isError={false} />
    );

    expect(screen.queryByTestId('loading-table-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('Test Run 1')).toBeInTheDocument();
    expect(screen.getByText('Test Run 2')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText(/Showing test runs submitted between/i)).toBeInTheDocument();
  });

  test('display a "no test runs found" message when an empty array is passed', async () => {
    // Act
    render(<TestRunsTable runsList={[]} {...defaultProps} />);

    // Assert: Check if the error state is displayed
    expect(
      await screen.findByText(/No test runs were found for the selected timeframe/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('displays the record limit warning when limitExceeded is true', async () => {
    // Arrange
    const mockRuns = generateMockRuns(5);

    // Act
    render(<TestRunsTable runsList={mockRuns} {...defaultProps} limitExceeded={true} />);

    // Assert
    const warningMessage = await screen.findByText(
      `Your query returned more than ` +
        MAX_DISPLAYABLE_TEST_RUNS +
        ` results. To avoid this in the future narrow your time frame or change your search criteria to return fewer results.`
    );
    expect(warningMessage).toBeInTheDocument();
  });

  test('displays no visible columns message when no columns are selected', async () => {
    // Arrange
    const mockRuns = generateMockRuns(2);

    // Act
    render(<TestRunsTable {...defaultProps} runsList={mockRuns} visibleColumns={[]} />);

    // Assert
    const noColumnsMessage = await screen.findByText(
      'All of the columns have been hidden in the table design tab, so no result details will be visible.'
    );
    expect(noColumnsMessage).toBeInTheDocument();
  });
});

describe('TestRunsTable Interactions', () => {
  test('navigates to run details when a run is clicked', async () => {
    // Arrange
    const mockRuns = generateMockRuns(1);

    render(<TestRunsTable runsList={mockRuns} {...defaultProps} />);
    const tableRow = await screen.findByText('Test Run 1');

    // Act
    fireEvent.click(tableRow);

    // Assert
    expect(mockRouterPush).toHaveBeenCalledWith('/test-runs/1');
  });

  test('handles pagination changes correctly', async () => {
    // Arrange
    const mockRuns = generateMockRuns(15);

    render(<TestRunsTable runsList={mockRuns} {...defaultProps} />);

    // Wait for the table to finish loading
    const table = await screen.findByRole('table');

    // Assert initial state
    expect(within(table).getAllByRole('row')).toHaveLength(11); // 1 header + 10 data
    // Assert correct page range text
    expect(screen.getByText(/of 2/i)).toBeInTheDocument();
    expect(screen.queryByText('Test Run 11')).not.toBeInTheDocument();

    // Act
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);

    // Assert final state
    await waitFor(() => {
      expect(screen.getByText('Test Run 11')).toBeInTheDocument();
    });
    expect(screen.queryByText('Test Run 1')).not.toBeInTheDocument();
  });

  test('pushes test runs breadcrumb with current search params when a run is clicked', async () => {
    // Arrange
    const mockRuns = generateMockRuns(1);
    // Provide a specific set of search params for this test's context
    const specificSearchParams = new URLSearchParams('status=finished&requestor=user1');
    mockUseSearchParams.mockReturnValue(specificSearchParams);

    render(<TestRunsTable runsList={mockRuns} {...defaultProps} />);

    // Act
    const tableRow = await screen.findByText('Test Run 1');
    fireEvent.click(tableRow);

    // Assert
    // Check that the breadcrumb route is built from the mocked search params
    expect(pushBreadCrumbMock).toHaveBeenCalledWith({
      title: 'testRuns',
      route: `/test-runs?${specificSearchParams.toString()}`,
    });
  });
});
