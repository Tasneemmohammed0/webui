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
import { TestRunsData } from '@/utils/testRuns';
import { MAX_RECORDS } from '@/utils/constants/common';

// Mock the useRouter hook from Next.js to return a mock router object.
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, any>) => {
    const translations: Record<string, string> = {
      "timeFrameText.range": "Showing test runs submitted between Jan 1 and Jan 10",
      "pagination.forwardText": "Next page",
      "noTestRunsFound":"No test runs were found for the selected timeframe",
      "pagination.of": "of {total}"
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

jest.mock('@/app/error/page', () =>
  function MockErrorPage() {
    return <div data-testid="error-page">Error Occurred</div>;
  }
);
jest.mock('@/components/common/StatusIndicator', () =>
  function StatusIndicator() {
    return <div data-testid="status-indicator">Status: {status}</div>;
  }
);

// Helper function to generate mock test runs data
const generateMockRuns = (count: number) => {
  return Array.from({length: count}, (_, index) => ({
    runId: `${index + 1}`,
    testStructure: {
      runName: `Test Run ${index + 1}`,
      requestor: `user${index + 1}`,
      group: `group${index + 1}`,
      bundle: `bundle${index + 1}`,
      package: `package${index + 1}`,
      testName: `test${index + 1}`,
      testShortName: `testShort${index + 1}`,
      status: "finished",
      result: index % 2 === 0 ? "Passed" : "Failed",
      submittedAt: new Date(Date.now() - index * 1000 * 60 * 60).toISOString(),
    },
  }));
};


describe('TestRunsTable Component', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    // Suppress console.error for rejected promise tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Rendering Logic', () => {
    test('shows loading state initially, then displays data when promise resolves', async() => {
      // Arrange
      const mockData: TestRunsData = { runs: generateMockRuns(2), limitExceeded: false };
      const runsPromise = Promise.resolve(mockData);

      // Act
      render(<TestRunsTable runsListPromise={runsPromise}/>);

      // Assert: Check if the loading state is displayed
      expect(screen.getByTestId('loading-table-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Test Run 1')).not.toBeInTheDocument();

      expect(await screen.findByText('Test Run 1')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-table-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText(/Showing test runs submitted between/i)).toBeInTheDocument();
    });
  });

  test('display an error component when an empty array is passed', async () => {
    // Arrange
    const emptyData: TestRunsData = { runs: [], limitExceeded: false };
    const runsPromise = Promise.resolve(emptyData);
    // Act
    render(<TestRunsTable runsListPromise={runsPromise} />);

    // Assert: Check if the error state is displayed
    expect(await screen.findByText(/No test runs were found for the selected timeframe/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('displays the record limit warning when limitExceeded is true', async () => {
    // Arrange
    const limitedData: TestRunsData = { runs: generateMockRuns(5), limitExceeded: true };
    const runsPromise = Promise.resolve(limitedData);

    // Act
    render(<TestRunsTable runsListPromise={runsPromise} />);

    // Assert
    const warningMessage = await screen.findByText(`Your query returned more than ${MAX_RECORDS} results. Showing the first ${MAX_RECORDS} records.`);
    expect(warningMessage).toBeInTheDocument();
  });
});

describe('TestRunsTable Interactions', () => {
  test('navigates to run details when a run is clicked', async () => {
    // Arrange
    const mockData: TestRunsData = { runs: generateMockRuns(1), limitExceeded: false };
    const runsPromise = Promise.resolve(mockData);

    render(<TestRunsTable runsListPromise={runsPromise} />);
    const tableRow = await screen.findByText('Test Run 1');

    // Act
    fireEvent.click(tableRow);

    // Assert
    expect(mockRouterPush).toHaveBeenCalledWith('/test-runs/1');
  });


  test('handles pagination changes correctly', async () => {
    // Arrange
    const mockData: TestRunsData = { runs: generateMockRuns(15), limitExceeded: false };
    const runsPromise = Promise.resolve(mockData);

    render(<TestRunsTable runsListPromise={runsPromise} />);
    
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
});