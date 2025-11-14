/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import TableDesignContent from '@/components/test-runs/table-design/TableDesignContent';
import { DEFAULT_VISIBLE_COLUMNS, RESULTS_TABLE_COLUMNS } from '@/utils/constants/common';
import { ColumnDefinition } from '@/utils/interfaces';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Child Components
jest.mock('@/components/test-runs/table-design/TableDesignRow', () => ({
  __esModule: true,
  default: ({ rowId, value, isSelected, onSelect, onClickArrowUp, onClickArrowDown }: any) => (
    <div data-testid={`row-${rowId}`}>
      <input
        data-testid={`checkbox-${rowId}`}
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(rowId)}
        aria-label={value}
      />
      <span>{value}</span>
      <button data-testid={`arrow-up-${rowId}`} onClick={onClickArrowUp}>
        ↑
      </button>
      <button data-testid={`arrow-down-${rowId}`} onClick={onClickArrowDown}>
        ↓
      </button>
    </div>
  ),
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
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      description: 'Customize your table view by showing, hiding, and reordering columns.',
      dragAndDropHeader: 'Drag columns to reorder',
      columnName: 'Column Name',
      noColumnsSelected:
        'No columns selected – nothing to display. Please select one or more columns.',
      resetToDefaults: 'Reset to defaults',
    };
    return translations[key] || key;
  },
}));

// Mock constants
jest.mock('@/utils/constants/common', () => ({
  DEFAULT_VISIBLE_COLUMNS: ['testName', 'status'],
  RESULTS_TABLE_COLUMNS: [
    { id: 'testName', columnName: 'Test Name' },
    { id: 'status', columnName: 'Status' },
    { id: 'requestor', columnName: 'Requestor' },
  ],
}));

// Mock test data
const mockTableRows: ColumnDefinition[] = [
  { id: 'testName', columnName: 'Test Name' },
  { id: 'requestor', columnName: 'Requestor' },
  { id: 'status', columnName: 'Status' },
];

describe('TableDesignContent', () => {
  let mockSetSelectedRowIds: jest.Mock;
  let mockSetTableRows: jest.Mock;
  let mockSetVisibleColumns: jest.Mock;
  let mockSetColumnsOrder: jest.Mock;
  let mockSetSortOrder: jest.Mock;
  let defaultProps: any;

  beforeEach(() => {
    mockSetSelectedRowIds = jest.fn();
    mockSetTableRows = jest.fn();
    mockSetVisibleColumns = jest.fn();
    mockSetColumnsOrder = jest.fn();
    mockSetSortOrder = jest.fn();

    defaultProps = {
      selectedRowIds: ['testName', 'requestor', 'status'],
      setSelectedRowIds: mockSetSelectedRowIds,
      tableRows: mockTableRows,
      setTableRows: mockSetTableRows,
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      columnsOrder: RESULTS_TABLE_COLUMNS,
      sortOrder: [],
      setVisibleColumns: mockSetVisibleColumns,
      setColumnsOrder: mockSetColumnsOrder,
      setSortOrder: mockSetSortOrder,
    };
  });

  describe('Rendering', () => {
    test('renders correctly without crashing', () => {
      render(<TableDesignContent {...defaultProps} />);
      expect(screen.getByText(/Customize your table view/i)).toBeInTheDocument();
      expect(screen.getByText('Column Name')).toBeInTheDocument();
    });

    test('should check the "Select All" checkbox if all rows are selected', () => {
      const allRowIds = mockTableRows.map((row) => row.id);
      render(<TableDesignContent {...defaultProps} selectedRowIds={allRowIds} />);
      const selectAllCheckbox = screen.getByRole('checkbox', { name: 'Select all rows' });
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Checkbox Selection Logic', () => {
    test("selects all rows when 'Select All' is clicked", () => {
      render(<TableDesignContent {...defaultProps} selectedRowIds={[]} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
      expect(mockSetSelectedRowIds).toHaveBeenCalledWith(mockTableRows.map((row) => row.id));
    });

    test('deselects all rows when "Select All" is clicked while all are selected', () => {
      const allRowIds = mockTableRows.map((row) => row.id);
      render(<TableDesignContent {...defaultProps} selectedRowIds={allRowIds} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
      expect(mockSetSelectedRowIds).toHaveBeenCalledWith([]);
    });

    test('displays a warning message when no columns are selected', () => {
      render(<TableDesignContent {...defaultProps} selectedRowIds={[]} />);

      expect(screen.getByText(/No columns selected – nothing to display/i)).toBeInTheDocument();
    });

    test('should call setSelectedRowIds with the correct row ID when a row checkbox is clicked', () => {
      const initialSelectedRowIds = ['testName'];
      render(<TableDesignContent {...defaultProps} selectedRowIds={initialSelectedRowIds} />);

      const requestorCheckbox = screen.getByTestId('checkbox-requestor');
      requestorCheckbox.click();

      expect(mockSetSelectedRowIds).toHaveBeenCalledWith(expect.any(Function));

      const updaterFunction = mockSetSelectedRowIds.mock.calls[0][0];
      expect(updaterFunction(initialSelectedRowIds)).toEqual(['testName', 'requestor']);
    });
  });

  describe('Row Reordering Logic', () => {
    test('should call setTableRows with new order on drag end', () => {
      render(<TableDesignContent {...defaultProps} selectedRowIds={[]} />);

      // Simulate dragging 'status' (index 2) over 'testName' (index 0)
      const event = { active: { id: 'status' }, over: { id: 'testName' } };
      capturedOnDragEnd(event);

      expect(mockSetTableRows).toHaveBeenCalledWith(expect.any(Function));

      // Verify the logic of the functional update
      const updaterFunction = mockSetTableRows.mock.calls[0][0];
      const newOrder = updaterFunction(mockTableRows);
      const newOrderIds = newOrder.map((row: any) => row.id);
      expect(newOrderIds).toEqual(['status', 'testName', 'requestor']);
    });
  });

  describe('Reset to Defaults Logic', () => {
    test('calls setters with default values when "Reset to defaults" is clicked', () => {
      const modifiedProps = {
        ...defaultProps,
        visibleColumns: ['testName'],
        columnsOrder: [...RESULTS_TABLE_COLUMNS].reverse(),
        sortOrder: [{ id: 'testName', order: 'asc' }],
      };

      render(<TableDesignContent {...modifiedProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset to defaults/i });
      fireEvent.click(resetButton);

      expect(mockSetVisibleColumns).toHaveBeenCalledWith(DEFAULT_VISIBLE_COLUMNS);
      expect(mockSetColumnsOrder).toHaveBeenCalledWith(RESULTS_TABLE_COLUMNS);
      expect(mockSetSortOrder).toHaveBeenCalledWith([]);
    });

    test('button is disabled when all settings are at their defaults', () => {
      render(<TableDesignContent {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset to defaults/i });
      expect(resetButton).toBeDisabled();
    });

    test('button is enabled when visible columns are modified', () => {
      const modifiedProps = {
        ...defaultProps,
        visibleColumns: ['testName'],
      };

      render(<TableDesignContent {...modifiedProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset to defaults/i });
      expect(resetButton).toBeEnabled();
    });

    test('button is enabled when columns order is modified', () => {
      const modifiedProps = {
        ...defaultProps,
        columnsOrder: [...RESULTS_TABLE_COLUMNS].reverse(),
      };

      render(<TableDesignContent {...modifiedProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset to defaults/i });
      expect(resetButton).toBeEnabled();
    });
  });
});
