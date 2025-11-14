/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TestRunGraph from '@/components/test-runs/graph/TestRunsGraph';
import { useRouter, useSearchParams } from 'next/navigation';
import { RESULTS_TABLE_COLUMNS } from '@/utils/constants/common';
import { DateTimeFormatProvider } from '@/contexts/DateTimeFormatContext';

jest.mock('next/navigation');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'timeFrameText.range': 'Showing test runs submitted between {from} and {to}',
      'limitExceeded.title': 'Limit Exceeded',
      'limitExceeded.subtitle': 'Showing only the first {MAX_DISPLAYABLE_TEST_RUNS} records.',
      errorLoadingGraph: 'Error loading graph',
      loadingGraph: 'Loading graph...',
      noTestRunsFound: 'No test runs found',
      submittedAt: 'Submitted at',
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
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));
jest.mock('@/hooks/useHistoryBreadCrumbs', () => () => ({ pushBreadCrumb: jest.fn() }));
jest.mock('@carbon/charts', () => ({
  ScaleTypes: { TIME: 'time' },
  TimeIntervalNames: { monthly: 'monthly' },
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

// Mock ResizeObserver for jsdom environment
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

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

const defaultProps = {
  runsList: generateMockRuns(2),
  visibleColumns: ['submittedAt', 'runName', 'requestor', 'testName', 'status', 'result'],
  orderedHeaders: RESULTS_TABLE_COLUMNS,
  limitExceeded: false,
  isLoading: false,
  isError: false,
};

describe('TestRunGraph', () => {
  it('renders the graph with data', () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} />
      </DateTimeFormatProvider>
    );
    expect(screen.getByText(/Showing test runs submitted between/)).toBeInTheDocument();
    // Check for legend items (status labels)
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    // Optionally, check for the chart container
    expect(document.querySelector('.cds--cc--chart-wrapper')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} isLoading={true} />
      </DateTimeFormatProvider>
    );
    expect(document.querySelector('.cds--skeleton__text')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} isError={true} />
      </DateTimeFormatProvider>
    );
    expect(screen.getByText(/Error loading graph/)).toBeInTheDocument();
  });

  it('shows no data message', () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} runsList={[]} />
      </DateTimeFormatProvider>
    );
    expect(screen.getByText(/No test runs found/)).toBeInTheDocument();
  });

  it('shows limit exceeded warning', () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} limitExceeded={true} />
      </DateTimeFormatProvider>
    );
    expect(screen.getByText(/Limit Exceeded/)).toBeInTheDocument();
  });

  it('navigates to the test run details page when a data point is clicked', async () => {
    render(
      <DateTimeFormatProvider>
        <TestRunGraph {...defaultProps} />
      </DateTimeFormatProvider>
    );

    const chartContainer = document.querySelector("[data-carbon-theme='white']");
    const mockDot = document.createElement('div');
    (mockDot as any).__data__ = {
      custom: defaultProps.runsList[0], // The run we expect to navigate to
    };
    chartContainer?.appendChild(mockDot);
    fireEvent.click(mockDot);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/test-runs/${defaultProps.runsList[0].id}`);
    });

    chartContainer?.removeChild(mockDot);
  });
});
