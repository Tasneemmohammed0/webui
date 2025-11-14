/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MethodsTab from '@/components/test-runs/test-run-details/MethodsTab';
import { TestMethod } from '@/generated/galasaapi';

// Mock the StatusCheck component
jest.mock('@/components/common/StatusIndicator', () => {
  return function MockStatusCheck({ status }: { status: string }) {
    return <div data-testid="status-check">{status}</div>;
  };
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Methods',
      subtitle: 'The list of methods executed during this test run.',
      search_placeholder: 'Search method',
      'table.methodName': 'Name',
      'table.status': 'Status',
      'table.result': 'Result',
      'table.duration': 'Duration',
    };
    return translations[key] || key;
  },
}));

// Mock the utility function
jest.mock('@/utils/timeOperations', () => ({
  getIsoTimeDifference: jest.fn((startTime: string, endTime: string) => {
    // Mock implementation - return a simple duration string
    return '00:05:30';
  }),
}));

// Mock the CSS module
jest.mock('@/styles/MethodsTab.module.css', () => ({
  titleContainer: 'mocked-title-container',
}));

// Mock Carbon React DataTable components
jest.mock('@carbon/react', () => ({
  DataTable: ({ children, rows, headers, isSortable }: any) => {
    const mockProps = {
      rows: rows.map((row: any, index: number) => ({
        id: row.id,
        cells: headers.map((header: any) => ({
          id: `${row.id}-${header.key}`,
          value: row[header.key],
        })),
      })),
      headers: headers,
      getHeaderProps: jest.fn(() => ({})),
      getRowProps: jest.fn(() => ({})),
      getTableProps: jest.fn(() => ({ size: 'lg' })),
      onInputChange: jest.fn(),
    };
    return <div data-testid="data-table">{children(mockProps)}</div>;
  },
  TableContainer: ({ children }: any) => <div data-testid="table-container">{children}</div>,
  Table: ({ children, size, ...props }: any) => (
    <table data-testid="table" size={size} {...props}>
      {children}
    </table>
  ),
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
  TableHeader: ({ children }: any) => <th data-testid="table-header">{children}</th>,
  TableToolbarContent: ({ children }: any) => (
    <div data-testid="table-toolbar-content">{children}</div>
  ),
  TableToolbarSearch: ({ placeholder, onChange }: any) => (
    <input data-testid="table-search" placeholder={placeholder} onChange={onChange} />
  ),
}));

jest.mock('@carbon/react/lib/components/DataTable/TableBody', () => {
  return function MockTableBody({ children }: any) {
    return <tbody data-testid="table-body">{children}</tbody>;
  };
});

jest.mock('@carbon/react/lib/components/DataTable/TableHead', () => {
  return function MockTableHead({ children }: any) {
    return <thead data-testid="table-head">{children}</thead>;
  };
});

jest.mock('@carbon/react/lib/components/DataTable/TableRow', () => {
  return function MockTableRow({ children }: any) {
    return <tr data-testid="table-row">{children}</tr>;
  };
});

describe('MethodsTab Component', () => {
  const mockMethods: TestMethod[] = [
    {
      methodName: 'testLogin',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T10:05:30Z',
      status: 'running',
      result: 'Passed',
    },
    {
      methodName: 'testLogout',
      startTime: '2024-01-01T10:05:30Z',
      endTime: '2024-01-01T10:08:00Z',
      status: 'finished',
      result: 'Failed',
    },
    {
      methodName: 'testValidation',
      startTime: '2024-01-01T10:08:00Z',
      endTime: '2024-01-01T10:10:15Z',
      status: 'finished',
      result: 'Passed',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the title and description correctly', () => {
      render(<MethodsTab methods={mockMethods} />);

      expect(screen.getByText('Methods')).toBeInTheDocument();
      expect(
        screen.getByText('The list of methods executed during this test run.')
      ).toBeInTheDocument();
    });

    it('renders the DataTable component', () => {
      render(<MethodsTab methods={mockMethods} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });

    it('renders the search functionality', () => {
      render(<MethodsTab methods={mockMethods} />);

      const searchInput = screen.getByTestId('table-search');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search method');
    });

    it('applies the correct CSS classes', () => {
      const { container } = render(<MethodsTab methods={mockMethods} />);

      const titleContainer = container.querySelector('.mocked-title-container');
      expect(titleContainer).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('processes methods data correctly', async () => {
      render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        // Check if method names are rendered
        expect(screen.getByText('testLogin')).toBeInTheDocument();
        expect(screen.getByText('testLogout')).toBeInTheDocument();
        expect(screen.getByText('testValidation')).toBeInTheDocument();
      });
    });

    it('handles empty methods array', () => {
      render(<MethodsTab methods={[]} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByText('Methods')).toBeInTheDocument();
    });

    it('handles methods with missing data gracefully', () => {
      const methodsWithMissingData: TestMethod[] = [
        {
          methodName: undefined,
          startTime: undefined,
          endTime: undefined,
          status: undefined,
          result: undefined,
        },
      ];

      expect(() => {
        render(<MethodsTab methods={methodsWithMissingData} />);
      }).not.toThrowError();
    });
  });

  describe('Table Headers', () => {
    it('renders all expected table headers', () => {
      render(<MethodsTab methods={mockMethods} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });
  });

  describe('Table Content', () => {
    it('renders method data in table cells', async () => {
      render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        // Check method names
        expect(screen.getByText('testLogin')).toBeInTheDocument();
        expect(screen.getByText('testLogout')).toBeInTheDocument();
        expect(screen.getByText('testValidation')).toBeInTheDocument();

        // Check statuses - use getAllByText since "finished" appears multiple times
        expect(screen.getByText('running')).toBeInTheDocument();
        const finishedElements = screen.getAllByText('finished');
        expect(finishedElements).toHaveLength(2);

        // Check that StatusCheck components are rendered for results
        const statusChecks = screen.getAllByTestId('status-check');
        expect(statusChecks).toHaveLength(3);
        expect(statusChecks[0]).toHaveTextContent('Passed');
        expect(statusChecks[1]).toHaveTextContent('Failed');
        expect(statusChecks[2]).toHaveTextContent('Passed');
      });
    });

    it('applies text transformation to status cells', async () => {
      render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        const runningElements = screen.getAllByText('running');
        const finishedElements = screen.getAllByText('finished');

        runningElements.forEach((element) => {
          expect(element.closest('p')).toHaveStyle('text-transform: capitalize');
        });

        finishedElements.forEach((element) => {
          expect(element.closest('p')).toHaveStyle('text-transform: capitalize');
        });
      });
    });
  });

  describe('Duration Calculation', () => {
    it('calls getIsoTimeDifference with correct parameters', () => {
      const { getIsoTimeDifference } = require('@/utils/timeOperations');

      render(<MethodsTab methods={mockMethods} />);

      expect(getIsoTimeDifference).toHaveBeenCalledWith(
        '2024-01-01T10:00:00Z',
        '2024-01-01T10:05:30Z'
      );
      expect(getIsoTimeDifference).toHaveBeenCalledWith(
        '2024-01-01T10:05:30Z',
        '2024-01-01T10:08:00Z'
      );
      expect(getIsoTimeDifference).toHaveBeenCalledWith(
        '2024-01-01T10:08:00Z',
        '2024-01-01T10:10:15Z'
      );
    });

    it('displays duration in table cells', async () => {
      render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        const durationElements = screen.getAllByText('00:05:30');
        expect(durationElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('StatusCheck Integration', () => {
    it('passes correct status values to StatusCheck components', async () => {
      render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        const statusChecks = screen.getAllByTestId('status-check');
        expect(statusChecks[0]).toHaveTextContent('Passed');
        expect(statusChecks[1]).toHaveTextContent('Failed');
        expect(statusChecks[2]).toHaveTextContent('Passed');
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input with correct placeholder', () => {
      render(<MethodsTab methods={mockMethods} />);

      const searchInput = screen.getByTestId('table-search');
      expect(searchInput).toHaveAttribute('placeholder', 'Search method');
    });

    it('search input responds to changes', () => {
      render(<MethodsTab methods={mockMethods} />);

      const searchInput = screen.getByTestId('table-search');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // The onChange should be called (mocked function)
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles methods with null/undefined values', () => {
      const methodsWithNulls: TestMethod[] = [
        {
          methodName: null as any,
          startTime: null as any,
          endTime: null as any,
          status: null as any,
          result: null as any,
        },
      ];

      expect(() => {
        render(<MethodsTab methods={methodsWithNulls} />);
      }).not.toThrow();
    });

    it('handles very long method names', () => {
      const longMethodName = 'a'.repeat(100);
      const methodsWithLongName: TestMethod[] = [
        {
          methodName: longMethodName,
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T10:05:30Z',
          status: 'finished',
          result: 'Passed',
        },
      ];

      render(<MethodsTab methods={methodsWithLongName} />);
      expect(screen.getByText(longMethodName)).toBeInTheDocument();
    });

    it('handles special characters in method names', () => {
      const specialMethodName = 'test@#$%^&*()_+{}|:<>?[];,./';
      const methodsWithSpecialChars: TestMethod[] = [
        {
          methodName: specialMethodName,
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T10:05:30Z',
          status: 'finished',
          result: 'Passed',
        },
      ];

      render(<MethodsTab methods={methodsWithSpecialChars} />);
      expect(screen.getByText(specialMethodName)).toBeInTheDocument();
    });
  });

  describe('Component Updates', () => {
    it('updates when methods prop changes', async () => {
      const { rerender } = render(<MethodsTab methods={mockMethods} />);

      await waitFor(() => {
        expect(screen.getByText('testLogin')).toBeInTheDocument();
      });

      const newMethods: TestMethod[] = [
        {
          methodName: 'newTestMethod',
          startTime: '2024-01-01T11:00:00Z',
          endTime: '2024-01-01T11:05:00Z',
          status: 'finished',
          result: 'Passed',
        },
      ];

      rerender(<MethodsTab methods={newMethods} />);

      await waitFor(() => {
        expect(screen.getByText('newTestMethod')).toBeInTheDocument();
        expect(screen.queryByText('testLogin')).not.toBeInTheDocument();
      });
    });
  });
});
