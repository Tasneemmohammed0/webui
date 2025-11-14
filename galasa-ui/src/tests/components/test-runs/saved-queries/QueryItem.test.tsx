/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NotificationType, SavedQueryType } from '@/utils/types/common';
import QueryItem from '@/components/test-runs/saved-queries/QueryItem';
import * as dndKitSortable from '@dnd-kit/sortable';
import { useSavedQueries } from '@/contexts/SavedQueriesContext';
import { encodeStateToUrlParam } from '@/utils/encoding/urlEncoder';

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: mockReplace,
    };
  },
  usePathname() {
    return '/test-runs';
  },
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      dragHandle: 'Drag to reorder',
      actions: 'Actions',
      rename: 'Rename',
      delete: 'Delete',
      copyToClipboard: 'Copy to Clipboard',
      setAsDefault: 'Set as Default',
      duplicate: 'Duplicate',
      copiedTitle: 'URL copy successful: ',
      copiedMessage: 'The URL for the query has been copied to your clipboard.',
      errorTitle: 'Error',
      successTitle: 'Success',
      copyFailedMessage: 'Failed to copy query URL',
      setAsDefaultMessage: 'The query is now your default query.',
      deleteTitle: 'Query Deleted',
      deleteMessage: 'The query was deleted successfully.',
      duplicateMessage: 'The query was duplicated successfully.',
    };
    return translations[key] || key;
  },
}));

// Mock the context hook
jest.mock('@/contexts/SavedQueriesContext', () => ({
  useSavedQueries: jest.fn(),
}));

jest.mock('@carbon/icons-react', () => ({
  StarFilled: () => <div data-testid="star-icon" />,
  Draggable: (props: any) => <div data-testid="draggable-icon" {...props} />,
}));

jest.mock('@carbon/react', () => ({
  OverflowMenu: (props: any) => (
    <div data-testid="overflow-menu" {...props}>
      {props.children}
    </div>
  ),
  OverflowMenuItem: (props: any) => (
    <button data-testid="overflow-menu-item" onClick={props.onClick} disabled={props.disabled}>
      {' '}
      <p>Item Text: {props.itemText}</p>
    </button>
  ),
}));

// Mock test data
const defaultQuery: SavedQueryType = {
  createdAt: 'default-query-id',
  title: 'Default Query',
  url: 'default-url',
};

const encodedStandardQueryName = encodeStateToUrlParam('queryName=Standard Query');

const standardQuery: SavedQueryType = {
  createdAt: 'standard-query-id',
  title: 'Standard Query',
  url: encodedStandardQueryName,
};

// Default return value for the useSortable mock
const mockSortableValues: any = {
  attributes: { role: 'button', 'aria-roledescription': 'sortable' },
  listeners: { onKeyDown: jest.fn() },
  setNodeRef: jest.fn(),
  transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
  transition: 'transform 250ms ease',
  isDragging: false,
};

describe('QueryItem', () => {
  // Mock clipboard API
  const mockWriteText = jest.fn();
  const originalNavigator = { ...global.navigator };

  beforeAll(() => {
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        clipboard: {
          writeText: mockWriteText,
        },
      },
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.spyOn(dndKitSortable, 'useSortable').mockReturnValue(mockSortableValues);
    // Directly mock the return value of the useSavedQueries hook
    (useSavedQueries as jest.Mock).mockReturnValue({
      defaultQuery,
      getQueryByName: jest.fn(),
      deleteQuery: jest.fn(),
      saveQuery: jest.fn(),
      isQuerySaved: jest.fn(),
      setDefaultQuery: jest.fn(),
    });
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clear mocks for useSavedQueries after each test to prevent pollution
    (useSavedQueries as jest.Mock).mockReset();
  });

  test('should render the query title and correct link', () => {
    render(<QueryItem query={standardQuery} />);

    const linkElement = screen.getByRole('button', { name: 'Standard Query' });
    expect(linkElement).toBeInTheDocument();
  });

  test('should display a drag handle icon and not the star icon', () => {
    render(<QueryItem query={standardQuery} />);

    expect(screen.getByTestId('draggable-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
  });

  test('should call useSortable with the correct id and disabled status (false by default)', () => {
    render(<QueryItem query={standardQuery} />);

    expect(dndKitSortable.useSortable).toHaveBeenCalledWith({
      id: standardQuery.createdAt,
      disabled: false,
    });
  });

  describe('Default Item', () => {
    test('should display the star icon and not the drag handle', () => {
      render(<QueryItem query={defaultQuery} />);

      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('draggable-icon')).not.toBeInTheDocument();
    });

    test('should be disabled by default for dnd-kit when the disabled prop is passed', () => {
      render(<QueryItem query={defaultQuery} disabled />);

      expect(dndKitSortable.useSortable).toHaveBeenCalledWith({
        id: defaultQuery.createdAt,
        disabled: true,
      });
    });
  });

  describe('Actions', () => {
    const mockHandleEditQuery = jest.fn();
    const mockSetNotification = jest.fn();
    const mockSetDefaultQuery = jest.fn();
    const mockSaveQuery = jest.fn();
    const mockDeleteQuery = jest.fn();
    const mockIsQuerySaved = jest.fn();

    beforeEach(() => {
      // Override the mock for useSavedQueries
      (useSavedQueries as jest.Mock).mockReturnValue({
        defaultQuery,
        getQueryByName: jest.fn((name: string) =>
          name === standardQuery.title ? standardQuery : undefined
        ),
        deleteQuery: mockDeleteQuery,
        saveQuery: mockSaveQuery,
        isQuerySaved: jest.fn(),
        setDefaultQuery: mockSetDefaultQuery,
      });
      mockSetNotification.mockClear();
      mockWriteText.mockResolvedValue(undefined);
    });

    test('should rename query when action is triggered', () => {
      render(<QueryItem query={standardQuery} handleEditQueryName={mockHandleEditQuery} />);

      // Open the overflow menu
      const overflowMenu = screen.getByTestId('overflow-menu');
      fireEvent.click(overflowMenu);

      // Click the "Rename" action
      const renameAction = screen.getByText('Item Text: Rename');
      fireEvent.click(renameAction);

      // Assert: route to the query url and call the edit handler
      expect(mockReplace).toHaveBeenCalledWith(`/test-runs?q=${standardQuery.url}`, {
        scroll: false,
      });
      expect(mockHandleEditQuery).toHaveBeenCalledWith(standardQuery.title);
    });

    test('should copy query URL to clipboard and show success notification', async () => {
      // Set window.location.origin for the test to correctly form the URL
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost',
          pathname: '/test-runs',
        },
        writable: true,
      });

      render(
        <QueryItem
          query={standardQuery}
          handleEditQueryName={mockHandleEditQuery}
          setNotification={mockSetNotification}
        />
      );

      // Open the overflow menu
      const overflowMenu = screen.getByTestId('overflow-menu');
      fireEvent.click(overflowMenu);

      // Click the "Copy to Clipboard" action
      const copyUrlAction = screen.getByText('Item Text: Copy to Clipboard');
      fireEvent.click(copyUrlAction);

      // Assert that navigator.clipboard.writeText was attempted
      const expectedFullUrl = `http://localhost/test-runs?q=${standardQuery.url}`;
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith(expectedFullUrl));

      // Assert that a success notification was shown
      expect(mockSetNotification).toHaveBeenCalledWith({
        kind: 'success',
        title: 'URL copy successful: ',
        subtitle: 'The URL for the query has been copied to your clipboard.',
      } as NotificationType);
    });

    test('should set query as default and show success notification', () => {
      render(<QueryItem query={standardQuery} setNotification={mockSetNotification} />);

      // Open the overflow menu
      const overflowMenu = screen.getByTestId('overflow-menu');
      fireEvent.click(overflowMenu);

      // Click the "Set as Default" action
      const setAsDefaultAction = screen.getByText('Item Text: Set as Default');
      fireEvent.click(setAsDefaultAction);

      // Assert that the setDefaultQuery function was called
      expect(mockSetDefaultQuery).toHaveBeenCalledWith(standardQuery.createdAt);

      // Assert that a success notification was shown
      expect(mockSetNotification).toHaveBeenCalledWith({
        kind: 'success',
        title: 'Success',
        subtitle: 'The query is now your default query.',
      } as NotificationType);
    });

    test('should delete query and show success notification', () => {
      render(<QueryItem query={standardQuery} setNotification={mockSetNotification} />);

      // Open the overflow menu
      const overflowMenu = screen.getByTestId('overflow-menu');
      fireEvent.click(overflowMenu);

      // Click the "Delete" action
      const deleteAction = screen.getByText('Item Text: Delete');
      fireEvent.click(deleteAction);

      // Assert that the deleteQuery function was called
      expect(mockDeleteQuery).toHaveBeenCalledWith(standardQuery.createdAt);

      // Assert that a success notification was shown
      expect(mockSetNotification).toHaveBeenCalledWith({
        kind: 'success',
        title: 'Query Deleted',
        subtitle: 'The query was deleted successfully.',
      } as NotificationType);
    });

    test('should duplicate query and show success notification', () => {
      mockIsQuerySaved.mockImplementation((title: string) => title === 'Standard Query');
      render(<QueryItem query={standardQuery} setNotification={mockSetNotification} />);

      // Open the overflow menu
      const overflowMenu = screen.getByTestId('overflow-menu');
      fireEvent.click(overflowMenu);

      // Click the "Duplicate" action
      const duplicateAction = screen.getByText('Item Text: Duplicate');
      fireEvent.click(duplicateAction);

      // Assert that the saveQuery function was called
      expect(mockSaveQuery).toHaveBeenCalled();

      // Assert that a success notification was shown
      expect(mockSetNotification).toHaveBeenCalledWith({
        kind: 'success',
        title: 'Success',
        subtitle: 'The query was duplicated successfully.',
      } as NotificationType);
    });
  });
});
