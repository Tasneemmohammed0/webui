/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TestRunsTabs from '@/components/test-runs/TestRunsTabs';

// Mock Child Components
const TestRunsTableMock = jest.fn((props) => <div data-testid="test-runs-table">Mocked Test Runs Table</div>);
jest.mock('@/components/test-runs/TestRunsTable', () => ({
  __esModule: true,
  default: (props: any) => TestRunsTableMock(props),
}));

jest.mock('@/components/test-runs/TimeFrameContent', () => ({
  __esModule: true,
  default: () => <div>Mocked Timeframe Content</div>,
}));

jest.mock('@/components/test-runs/SearchCriteriaContent', () => ({
  __esModule: true,
  default: () => <div>Mocked Search Criteria Content</div>,
}));

let capturedSetSelectedVisibleColumns: (columns: string[]) => void;
let capturedSetColumnsOrder: (order: { id: string; columnName: string }[]) => void;

jest.mock('@/components/test-runs/TableDesignContent', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedSetSelectedVisibleColumns = props.setSelectedRowIds;
    capturedSetColumnsOrder = props.setTableRows;
    return <div>Mocked Table Design Content</div>;
  },
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "tabs.timeframe": "Timeframe",
      "tabs.tableDesign": "Table Design",
      "tabs.searchCriteria": "Search Criteria",
      "tabs.results": "Results",
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
  usePathname: () => '/',
}));

jest.mock('@/utils/constants/common', () => ({
  RESULTS_TABLE_COLUMNS:  [
    { id: 'submittedAt', columnName: 'Submitted' },
    { id: 'testRunName', columnName: 'Test Run Name' },
    { id: 'requestor', columnName: 'Requestor' },
    { id: 'testName', columnName: 'Test Name' },
    { id: 'status', columnName: 'Status' },
    { id: 'result', columnName: 'Result' },
  ],
  COLUMNS_IDS: {
    SUBMITTED_AT: 'submittedAt',
    TEST_RUN_NAME: 'testRunName',
    REQUESTOR: 'requestor',
    TEST_NAME: 'testName',
    STATUS: 'status',
    RESULT: 'result',
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
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

describe('TestRunsTabs Component', () => {
  const mockPromise = Promise.resolve({ runs: [], limitExceeded: false });
  const mockRequestorNamesPromise = Promise.resolve([]);
  const mockResultsNamesPromise = Promise.resolve([]);

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Default to returning empty search params. Individual tests can override this.
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  test('renders all tabs correctly', () => {
    render(
      <TestRunsTabs
        runsListPromise={mockPromise}
        requestorNamesPromise={mockRequestorNamesPromise}
        resultsNamesPromise={mockResultsNamesPromise}
      />
    );
    const tabLabels = ['Timeframe', 'Table Design', 'Search Criteria', 'Results'];
    tabLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('displays the content of the Timeframe tab', () => {
    render(
      <TestRunsTabs
        runsListPromise={mockPromise}
        requestorNamesPromise={mockRequestorNamesPromise}
        resultsNamesPromise={mockResultsNamesPromise}
      />
    );
    const timeframeTab = screen.getByRole('tab', { name: 'Timeframe' });
    fireEvent.click(timeframeTab);

    expect(timeframeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Mocked Timeframe Content')).toBeVisible();
  });

  test('switches to the "Results" tab and displays its content on click', async () => {
    render(
      <TestRunsTabs
        runsListPromise={mockPromise}
        requestorNamesPromise={mockRequestorNamesPromise}
        resultsNamesPromise={mockResultsNamesPromise}
      />
    );
    const resultsTab = screen.getByRole('tab', { name: 'Results' });
    fireEvent.click(resultsTab);

    expect(resultsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('test-runs-table')).toBeVisible();
  });

  describe('URL State Management', () => {
    test('loads state from URL parameters on initial render', async () => {
      // Arrange: Provide specific URL parameters for this test
      const params = new URLSearchParams();
      params.set('visibleColumns', 'status,result');
      params.set('columnsOrder', 'result,status,testName');
      mockUseSearchParams.mockReturnValue(params);
  
      // Act
      render(
        <TestRunsTabs
          runsListPromise={mockPromise}
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );
  
      // Assert: Wait for the component to process the params and pass them as props
      await waitFor(() => {
        expect(TestRunsTableMock).toHaveBeenCalledWith(expect.objectContaining({
          visibleColumns: ['status', 'result'],
          orderedHeaders: [
            { id: 'result', columnName: 'Result' },
            { id: 'status', columnName: 'Status' },
            { id: 'testName', columnName: 'Test Name' },
          ]
        }));
      });
    });

    test('saves default state to URL when no parameters are present', async () => {
      // Act
      render(
        <TestRunsTabs
          runsListPromise={mockPromise}
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );
  
      // Assert: Wait for the initialization and save effect to run
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
        
      const expectedParams = new URLSearchParams();
      const defaultVisible = "submittedAt,testRunName,requestor,testName,status,result";
      const defaultOrder = "submittedAt,testRunName,requestor,testName,status,result";
      expectedParams.set('tab', 'timeframe')
      expectedParams.set('visibleColumns', defaultVisible);
      expectedParams.set('columnsOrder', defaultOrder);
  
      expect(mockReplace).toHaveBeenCalledWith(`/?${expectedParams.toString()}`, { scroll: false });
    });

    test('updates URL when selected visible columns are changed', async () => {
      // Arrange
      render(
        <TestRunsTabs
          runsListPromise={mockPromise}
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1)); 
      mockReplace.mockClear();
  
      // Act: Simulate a child component updating the state
      act(() => {
        capturedSetSelectedVisibleColumns(['status', 'result']);
      });
  
      // Assert: The save-to-URL effect runs again with the new state
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
  
      const urlCall = mockReplace.mock.calls[0][0];
      const params = new URLSearchParams(urlCall.split('?')[1]);
      expect(params.get('visibleColumns')).toBe('status,result');
      expect(params.get('columnsOrder')).toBe('submittedAt,testRunName,requestor,testName,status,result');
    });

    test('updates URL when column order is changed', async () => {
      // Arrange
      render(
        <TestRunsTabs
          runsListPromise={mockPromise}
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Wait for the initial save
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1)); 
      mockReplace.mockClear();
  
      // Act: Simulate a child component updating the state
      const newOrder = [ { id: 'result', columnName: 'Result' }, { id: 'status', columnName: 'Status' }];
      act(() => {
        capturedSetColumnsOrder(newOrder);
      });
  
      // Assert
      await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
  
      const urlCall = mockReplace.mock.calls[0][0];
      const params = new URLSearchParams(urlCall.split('?')[1]);
      expect(params.get('columnsOrder')).toBe('result,status');
      expect(params.get('visibleColumns')).toBe('submittedAt,testRunName,requestor,testName,status,result');
    });
  });
});