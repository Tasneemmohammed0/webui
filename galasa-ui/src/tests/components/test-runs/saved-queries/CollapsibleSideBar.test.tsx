/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import CollapsibleSideBar from '@/components/test-runs/saved-queries/CollapsibleSideBar';
import { useSavedQueries } from '@/contexts/SavedQueriesContext';
import { useTestRunsQueryParams } from '@/contexts/TestRunsQueryParamsContext';

// Mock test data
let mockQueryName = 'Initial Query';
const mockIsQuerySaved = jest.fn();
const mockSaveQuery = jest.fn();
const mockSetQueryName = jest.fn();
const mockSetSavedQueries = jest.fn();
const mockHandleEditQueryName = jest.fn();
const mockQueries = [
  { createdAt: '2023-01-01T00:00:00Z', title: 'Test Run 1', url: '' },
  { createdAt: '2023-01-02T00:00:00Z', title: 'Test Run 2', url: '' },
  { createdAt: '2023-01-03T00:00:00Z', title: 'Test Run 3', url: '' },
];

// Mock child components
jest.mock('@/components/test-runs/saved-queries/QueryItem', () => ({
  __esModule: true,
  default: ({ query }: { query: { title: string } }) => <div>{query.title}</div>,
}));

// Mock contexts
jest.mock('@/contexts/SavedQueriesContext', () => ({
  SavedQueriesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSavedQueries: jest.fn(),
}));

jest.mock('@/contexts/TestRunsQueryParamsContext', () => ({
  TestRunsQueryParamsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTestRunsQueryParams: jest.fn(),
}));

// Mock the DndContext to capture the onDragEnd function for testing
let capturedOnDragEnd: (event: any) => void;
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children, onDragEnd }: any) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
}));

// Mock the useTranslations hook from next-intl
jest.mock('next-intl', () => {
  return {
    useTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        newQuerySavedTitle: 'New Query Saved',
        savedQueries: 'Saved Queries',
        searchSavedQueries: 'Search Saved Queries',
        addCurrentQuery: 'Add Current Query',
        savedQueriesSidebarLabel: 'Saved Queries Sidebar',
      };
      return translations[key] || key;
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryName = 'Initial Query';

  (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
    queryName: mockQueryName,
    setQueryName: mockSetQueryName,
    searchParams: '',
  }));

  (useSavedQueries as jest.Mock).mockImplementation(() => ({
    saveQuery: mockSaveQuery,
    isQuerySaved: mockIsQuerySaved,
    savedQueries: mockQueries,
    defaultQuery: mockQueries[0],
    setSavedQueries: mockSetSavedQueries,
  }));
});

describe('CollapsibleSideBar', () => {
  describe('Rendering', () => {
    test('should render in a collapsed state by default', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const sidebar = screen.getByLabelText('Saved Queries Sidebar');
      expect(sidebar).toHaveClass('sideNavCollapsed');
    });

    test('should expand when the header button is clicked', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const sidebar = screen.getByLabelText('Saved Queries Sidebar');
      const headerButton = screen.getByRole('button', { name: 'Saved Queries' });

      // Click the header button to expand the sidebar
      fireEvent.click(headerButton);

      expect(sidebar).toHaveClass('sideNavExpanded');
    });

    test('should render a list of all saved queries provided by the context', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      expect(screen.getByText('Test Run 1')).toBeInTheDocument();
      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.getByText('Test Run 3')).toBeInTheDocument();
    });

    test('should display the search input and the "Add Current Query" button', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const searchInput = screen.getByPlaceholderText('Search Saved Queries');
      const addButton = screen.getByRole('button', { name: 'Add Current Query' });

      expect(searchInput).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should filter the query list to show only matching items', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const searchInput = screen.getByPlaceholderText('Search Saved Queries');

      fireEvent.change(searchInput, { target: { value: 'Test Run 2' } });

      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Run 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Run 3')).not.toBeInTheDocument();
    });

    test('should exclude the default query from search results', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const searchInput = screen.getByPlaceholderText('Search Saved Queries');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      // The search term "Test" matches the sortable items but not the default
      expect(screen.queryByText('Test Run 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.getByText('Test Run 3')).toBeInTheDocument();
    });

    test('should restore the full query list when the search input is cleared', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const searchInput = screen.getByPlaceholderText('Search Saved Queries');

      fireEvent.change(searchInput, { target: { value: 'Test Run 3' } });
      // Check that it is filtered first
      expect(screen.queryByText('Test Run 2')).not.toBeInTheDocument();

      // Simulate clearing the search input
      fireEvent.change(searchInput, { target: { value: '' } });

      //  Check if all queries' actual titles are restored
      expect(screen.getByText('Test Run 1')).toBeInTheDocument();
      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.getByText('Test Run 3')).toBeInTheDocument();
    });

    test('should perform a case-insensitive search', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const searchInput = screen.getByPlaceholderText('Search Saved Queries');
      fireEvent.change(searchInput, { target: { value: 'test run 2' } });

      // Check if the correct query is displayed using its actual title
      expect(screen.getByText('Test Run 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Run 3')).not.toBeInTheDocument();
    });
  });

  describe('Add Current Query', () => {
    test('should call saveQuery and show a notification message when a query is saved', () => {
      mockQueryName = 'Mock Query Item 1';
      (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
        queryName: mockQueryName,
        setQueryName: mockSetQueryName,
        searchParams: '',
      }));

      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const addButton = screen.getByRole('button', { name: 'Add Current Query' });
      fireEvent.click(addButton);

      expect(mockSaveQuery).toHaveBeenCalledWith({
        title: 'Mock Query Item 1',
        createdAt: expect.any(String),
        url: expect.any(String),
      });
      expect(screen.getByText('New Query Saved')).toBeInTheDocument();
    });

    test('should not save a query if the current query name is empty or only whitespace', () => {
      mockQueryName = '   ';
      (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
        queryName: mockQueryName,
        setQueryName: mockSetQueryName,
        searchParams: '',
      }));
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const addButton = screen.getByRole('button', { name: 'Add Current Query' });

      fireEvent.click(addButton);

      expect(mockSaveQuery).not.toHaveBeenCalled();
    });

    test('should append a number to the query name if a query with the same name already exists', () => {
      mockQueryName = 'Test Run 2'; // This name already exists
      (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
        queryName: mockQueryName,
        setQueryName: mockSetQueryName,
        searchParams: '',
      }));
      // It returns true only for the name that already exists
      mockIsQuerySaved.mockImplementation((queryTitle) => {
        return queryTitle === 'Test Run 2';
      });

      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const addButton = screen.getByRole('button', { name: 'Add Current Query' });

      fireEvent.click(addButton);

      expect(mockSaveQuery).toHaveBeenCalledWith({
        title: 'Test Run 2 (1)',
        createdAt: expect.any(String),
        url: expect.any(String),
      });
    });

    test('should update query name when a new query is saved', () => {
      mockQueryName = 'Mock Query Item 1';
      (useTestRunsQueryParams as jest.Mock).mockImplementation(() => ({
        queryName: mockQueryName,
        setQueryName: mockSetQueryName,
        searchParams: '',
      }));
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);
      const addButton = screen.getByRole('button', { name: 'Add Current Query' });

      fireEvent.click(addButton);

      expect(mockHandleEditQueryName).toHaveBeenCalledWith('Mock Query Item 1');
    });
  });

  describe('Drag and Drop', () => {
    test('should reorder queries when an item is dropped in a new position', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      // Sortable items are 'Test Run 2' and 'Test Run 3'. 'Test Run 1' is default and not sortable.
      const itemToDrag = mockQueries[2]; // 'Test Run 3'
      const dropTarget = mockQueries[1]; // 'Test Run 2'

      // Simulate dragging 'Test Run 3' to the position of 'Test Run 2'
      capturedOnDragEnd({
        active: { id: itemToDrag.createdAt },
        over: { id: dropTarget.createdAt },
      });

      // Original order: [Default, Item2, Item3]
      // Expected new order: [Default, Item3, Item2]
      const expectedNewOrder = [mockQueries[0], mockQueries[2], mockQueries[1]];

      expect(mockSetSavedQueries).toHaveBeenCalledWith(expectedNewOrder);
    });

    test('should reorder correctly when dragging an item down the list', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      const itemToDrag = mockQueries[1]; // 'Test Run 2'
      const dropTarget = mockQueries[2]; // 'Test Run 3'

      // Simulate dragging 'Test Run 2' down to the position of 'Test Run 3'
      capturedOnDragEnd({
        active: { id: itemToDrag.createdAt },
        over: { id: dropTarget.createdAt },
      });

      // Original order: [Default, Item2, Item3]
      // Expected new order: [Default, Item3, Item2]
      const expectedNewOrder = [mockQueries[0], mockQueries[2], mockQueries[1]];
      expect(mockSetSavedQueries).toHaveBeenCalledWith(expectedNewOrder);
      expect(mockSetSavedQueries).toHaveBeenCalledTimes(1);
    });

    test('should not reorder if an item is dropped in its original position', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      const itemToDragAndDrop = mockQueries[2]; // 'Test Run 3'

      // Simulate dropping an item onto itself
      capturedOnDragEnd({
        active: { id: itemToDragAndDrop.createdAt },
        over: { id: itemToDragAndDrop.createdAt },
      });

      // The component should detect no change and not call the update function
      expect(mockSetSavedQueries).not.toHaveBeenCalled();
    });

    test('should not reorder if an item is dropped onto the non-sortable default query', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      const itemToDrag = mockQueries[2]; // 'Test Run 3'
      const dropTarget = mockQueries[0]; // The default query, 'Test Run 1'

      // Simulate dropping a sortable item onto the non-sortable default query
      capturedOnDragEnd({
        active: { id: itemToDrag.createdAt },
        over: { id: dropTarget.createdAt },
      });

      // The component logic should prevent this, as the drop target is not in the `sortableQueries` array
      expect(mockSetSavedQueries).not.toHaveBeenCalled();
    });

    test('should not reorder if the non-sortable default query is dragged', () => {
      render(<CollapsibleSideBar handleEditQueryName={mockHandleEditQueryName} />);

      const itemToDrag = mockQueries[0]; // The default query, 'Test Run 1'
      const dropTarget = mockQueries[2]; // A valid sortable item

      // Simulate dragging the non-sortable default query
      capturedOnDragEnd({
        active: { id: itemToDrag.createdAt },
        over: { id: dropTarget.createdAt },
      });

      // The component logic should prevent this, as the dragged item is not in the `sortableQueries` array
      expect(mockSetSavedQueries).not.toHaveBeenCalled();
    });
  });
});
