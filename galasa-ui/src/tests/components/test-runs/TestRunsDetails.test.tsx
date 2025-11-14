/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import TestRunsDetails from '@/components/test-runs/TestRunsDetails';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SavedQueriesProvider, useSavedQueries } from '@/contexts/SavedQueriesContext';
import { DateTimeFormatProvider } from '@/contexts/DateTimeFormatContext';
import * as Nav from 'next/navigation';
import {
  TestRunsQueryParamsProvider,
  useTestRunsQueryParams,
} from '@/contexts/TestRunsQueryParamsContext';
import userEvent from '@testing-library/user-event';
import { encodeStateToUrlParam } from '@/utils/encoding/urlEncoder';

const mockUpdateQuery = jest.fn();
const mockGetQuery = jest.fn();
const mockIsQuerySaved = jest.fn();
const mockSaveQuery = jest.fn();
const mockSetQueryName = jest.fn();

let mockQueryName = 'Initial Query';
let mockSearchParams = new URLSearchParams();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn((newUrl) => {
    const newQueryString = newUrl.split('?')[1] || '';
    mockSearchParams = new URLSearchParams(newQueryString);
  }),
};

const mockGetResolvedTimeZone = jest.fn(() => 'UTC');

// Mock useHistoryBreadCrumbs hook
jest.mock('@/hooks/useHistoryBreadCrumbs', () => ({
  __esModule: true,
  default: () => ({
    breadCrumbItems: [{ title: 'Home', route: '/' }],
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/mock-path'),
  useSearchParams: jest.fn(() => mockSearchParams),
  useRouter: jest.fn(() => mockRouter),
}));

// Mock contexts
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  DateTimeFormatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDateTimeFormat: () => ({
    getResolvedTimeZone: mockGetResolvedTimeZone,
  }),
}));

jest.mock('@/contexts/SavedQueriesContext', () => ({
  SavedQueriesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSavedQueries: jest.fn(() => ({
    saveQuery: mockSaveQuery,
    isQuerySaved: mockIsQuerySaved,
    getQueryByName: mockGetQuery,
    updateQuery: mockUpdateQuery,
  })),
}));

jest.mock('@/contexts/TestRunsQueryParamsContext', () => ({
  TestRunsQueryParamsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTestRunsQueryParams: jest.fn(() => ({
    queryName: mockQueryName,
    setQueryName: mockSetQueryName,
    searchParams: mockSearchParams,
  })),
}));

// Mock other components
jest.mock('@/components/common/BreadCrumb', () => {
  const BreadCrumb = ({ breadCrumbItems }: { breadCrumbItems: any[] }) => (
    <nav data-testid="breadcrumb" data-route={breadCrumbItems[0]?.route || ''}>
      Home
    </nav>
  );
  BreadCrumb.displayName = 'BreadCrumb';
  return { __esModule: true, default: BreadCrumb };
});

jest.mock('@/components/test-runs/TestRunsTabs', () => {
  const TestRunsTabs = () => <div data-testid="mock-test-runs-tabs">Test Runs Tabs</div>;
  TestRunsTabs.displayName = 'TestRunsTabs';
  return { __esModule: true, default: TestRunsTabs };
});

jest.mock('@/components/test-runs/saved-queries/CollapsibleSideBar', () => {
  const CollapsibleSideBar = () => (
    <div data-testid="mock-collapsible-sidebar">Collapsible SideBar</div>
  );
  CollapsibleSideBar.displayName = 'CollapsibleSideBar';
  return { __esModule: true, default: CollapsibleSideBar };
});

// Mock translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: { name: string }) =>
    ({
      'TestRun.title': 'Test Run Details',
      copiedTitle: 'Copied!',
      copiedMessage: 'URL copied to clipboard.',
      errorTitle: 'Error',
      successTitle: 'Success',
      copyFailedMessage: 'Failed to copy URL.',
      editQueryName: 'Edit query name',
      nameExistsError: `Query with name "${vars?.name}" already exists.`,
      newQuerySavedMessage: `Query "${vars?.name}" has been saved.`,
      queryUpdatedMessage: 'The query has been updated successfully.',
      saveQuery: 'Save Query',
    })[key] || key,
}));

// Carbon React mocks
jest.mock('@carbon/react', () => ({
  Button: ({ children, iconDescription, disabled, ...props }: any) => (
    <button {...props} aria-label={iconDescription} disabled={disabled}>
      {children}
    </button>
  ),
  Tile: ({ children, ...props }: any) => (
    <div {...props} data-testid="tile">
      {children}
    </div>
  ),
  InlineNotification: ({ title, subtitle, kind }: any) => (
    <div data-testid="notification" className={`notification-${kind}`}>
      <strong>{title}</strong>
      <p>{subtitle}</p>
    </div>
  ),
  SkeletonText: ({ heading }: any) => (
    <div data-testid="skeleton-text" className={heading ? 'skeleton-heading' : 'skeleton-text'}>
      Loading...
    </div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DateTimeFormatProvider>
        <SavedQueriesProvider>
          <TestRunsQueryParamsProvider>{ui}</TestRunsQueryParamsProvider>
        </SavedQueriesProvider>
      </DateTimeFormatProvider>
    </QueryClientProvider>
  );
};

beforeAll(() => {
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
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
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
  mockQueryName = 'Initial Query';

  (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
    queryName: mockQueryName,
    setQueryName: mockSetQueryName,
    searchParams: mockSearchParams,
  }));
  (useSavedQueries as jest.Mock).mockImplementation(() => ({
    saveQuery: mockSaveQuery,
    isQuerySaved: mockIsQuerySaved,
    getQueryByName: mockGetQuery,
    updateQuery: mockUpdateQuery,
  }));
  (Nav.useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);
});

const mockRequestorNamesPromise = Promise.resolve(['requestor1', 'requestor2']);
const mockResultsNamesPromise = Promise.resolve(['result1', 'result2']);

describe('TestRunsDetails', () => {
  test('renders breadcrumbs and page title', () => {
    renderWithProviders(
      <TestRunsDetails
        requestorNamesPromise={mockRequestorNamesPromise}
        resultsNamesPromise={mockResultsNamesPromise}
      />
    );
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByTestId('tile')).toBeInTheDocument();
  });

  test('should render the main content area with TestRunsTabs', () => {
    renderWithProviders(
      <TestRunsDetails
        requestorNamesPromise={mockRequestorNamesPromise}
        resultsNamesPromise={mockResultsNamesPromise}
      />
    );
    expect(screen.getByTestId('mock-test-runs-tabs')).toBeInTheDocument();
  });

  describe('Copy to Clipboard', () => {
    test('copies the URL when share button is clicked', async () => {
      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      const shareButton = screen.getByRole('button', { name: 'copyMessage' });
      await act(async () => {
        shareButton.click();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });

    test('shows success notification when URL is copied', async () => {
      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );
      const shareButton = screen.getByRole('button', { name: 'copyMessage' });
      await act(async () => {
        shareButton.click();
      });
      const notification = await screen.findByTestId('notification');
      expect(notification).toHaveClass('notification-success');
      expect(notification).toHaveTextContent('Copied!');
    });

    test('shows error notification when copy fails', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Copy failed'));
      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      const shareButton = screen.getByRole('button', { name: 'copyMessage' });
      await act(async () => {
        shareButton.click();
      });
      const notification = await screen.findByTestId('notification');
      expect(notification).toHaveClass('notification-error');
      expect(notification).toHaveTextContent('Error');
    });
  });

  describe('Edit Query Name', () => {
    test('shows the default query name when no name is provided in the URL', () => {
      mockQueryName = 'Default Query';
      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      expect(screen.getByText('Default Query')).toBeInTheDocument();
    });

    test('successfully enters edit mode, renames, and saves a query', async () => {
      // Arrange
      const user = userEvent.setup();
      const initialQuery = { title: 'Initial Query', createdAt: '2023-01-01', url: '' };
      // Set the old name to exist
      mockGetQuery.mockReturnValue(initialQuery);
      // Set the new name to be available
      mockIsQuerySaved.mockReturnValue(false);

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Clear mocks after initial render to ignore setup calls
      jest.clearAllMocks();

      // Act
      // 1. Click edit button
      const editButton = screen.getByRole('button', { name: /Edit query name/i });
      await user.click(editButton);

      // 2. Type the new name
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Initial Query');
      await user.clear(input);
      await user.type(input, 'My Renamed Query');

      // 3. Save by blurring the input
      await user.tab();

      // Assert
      expect(mockUpdateQuery).toHaveBeenCalledTimes(1);
      // encode url first
      const encodedURL = encodeStateToUrlParam('queryName=My+Renamed+Query&tab=results');
      expect(mockUpdateQuery).toHaveBeenCalledWith(initialQuery.createdAt, {
        ...initialQuery,
        title: 'My Renamed Query',
        url: encodedURL, // URL is updated with new name
      });

      expect(mockSetQueryName).toHaveBeenCalledTimes(1);
      expect(mockSetQueryName).toHaveBeenCalledWith('My Renamed Query');
    });

    test('renames an unsaved query without calling updateQuery', async () => {
      // Arrange
      const user = userEvent.setup();
      mockGetQuery.mockReturnValue(null);
      mockIsQuerySaved.mockReturnValue(false);

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Clear mocks after initial render to ignore setup calls
      jest.clearAllMocks();

      // Act
      await user.click(screen.getByRole('button', { name: /Edit query name/i }));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'A Brand New Name');
      await user.tab();

      // Should only update local/URL state, not persistent storage
      expect(mockUpdateQuery).not.toHaveBeenCalled();
      expect(mockSetQueryName).toHaveBeenCalledWith('A Brand New Name');
    });

    test('revert to previous query name when the input is empty', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Clear mocks after initial render to ignore setup calls
      jest.clearAllMocks();

      // Act
      await user.click(screen.getByRole('button', { name: /Edit query name/i }));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.tab();

      // Assert
      expect(mockUpdateQuery).not.toHaveBeenCalled();
      expect(mockSetQueryName).not.toHaveBeenCalled();
      expect(screen.getByText('Initial Query')).toBeInTheDocument();
    });

    test('shows an error notification if the new name already exists', async () => {
      const user = userEvent.setup();
      mockGetQuery.mockReturnValue({ title: 'Initial Query' });
      mockIsQuerySaved.mockReturnValue(true);

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit query name/i }));

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Existing Name');
      await user.tab();

      const notification = await screen.findByTestId('notification');
      expect(notification).toHaveClass('notification-error');
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Query with name "Existing Name" already exists/)
      ).toBeInTheDocument();
      expect(mockUpdateQuery).not.toHaveBeenCalled();
    });
  });

  describe('Save Query', () => {
    test('saves a new query and shows a successful notification', async () => {
      const user = userEvent.setup();
      mockQueryName = 'New Test Query';

      // It doesn't exist yet
      mockIsQuerySaved.mockReturnValue(false);
      mockGetQuery.mockReturnValue(null);

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Verify button is not disabled
      const saveButton = screen.getByRole('button', { name: /Save Query/i });
      expect(saveButton).not.toBeDisabled();

      // Act
      await user.click(saveButton);

      // Assert
      await waitFor(() => {
        const encodedURL = encodeStateToUrlParam('tab=results&queryName=New+Test+Query');
        expect(mockSaveQuery).toHaveBeenCalledTimes(1);
        expect(mockSaveQuery).toHaveBeenCalledWith({
          title: 'New Test Query',
          url: encodedURL,
          createdAt: expect.any(String),
        });
      });

      const notification = await screen.findByTestId('notification');
      expect(notification).toHaveClass('notification-success');
      expect(mockUpdateQuery).not.toHaveBeenCalled();
    });

    test('update an existing query', async () => {
      const user = userEvent.setup();
      mockQueryName = 'Existing Query';
      mockSearchParams.set('queryName', 'Existing Query');
      mockSearchParams.set('requestor', 'test');

      const existingQuery = { title: 'Existing Query', createdAt: '2023-01-01', url: 'old=params' };
      // Simulate that the query already exists
      mockGetQuery.mockReturnValue(existingQuery);

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Act
      await user.click(screen.getByRole('button', { name: /Save Query/i }));

      // Assert: should call update, not save
      expect(mockUpdateQuery).toHaveBeenCalledTimes(1);
      expect(mockSaveQuery).not.toHaveBeenCalled();

      const notification = await screen.findByTestId('notification');
      expect(notification).toHaveClass('notification-success');
      expect(screen.getByText('The query has been updated successfully.')).toBeInTheDocument();
    });

    test('disable save button when query name is not unique', async () => {
      const user = userEvent.setup();
      mockQueryName = 'Conflict Query';
      mockGetQuery.mockReturnValue(null);
      // isQuerySaved should be true for the original name, but false for the new one
      mockIsQuerySaved.mockImplementation((name) => name === 'Conflict Query');

      renderWithProviders(
        <TestRunsDetails
          requestorNamesPromise={mockRequestorNamesPromise}
          resultsNamesPromise={mockResultsNamesPromise}
        />
      );

      // Verify button is  disabled
      const saveButton = screen.getByRole('button', { name: /Save Query/i });
      expect(saveButton).toBeDisabled();
    });
  });
});
