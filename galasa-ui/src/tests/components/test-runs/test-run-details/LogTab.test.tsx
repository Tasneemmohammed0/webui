/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogTab from '@/components/test-runs/test-run-details/LogTab';
import { handleDownload } from '@/utils/artifacts';

// Mock the utility function
jest.mock('@/utils/artifacts', () => ({
  handleDownload: jest.fn(),
}));

// Mock the next-intl translations
jest.mock('next-intl', () => ({
  useTranslations: () => {
    return (key: string, vars?: Record<string, any>) => {
      // For matchCounter, return formatted "current of total"
      if (key === 'matchCounter' && vars) {
        return `${vars.current} of ${vars.total}`;
      }
      // Provide dummy translations for other keys used in LogTab:
      const dummy: Record<string, string> = {
        title: 'Run Log',
        description:
          'A step-by-step log of what happened over time when the Run was preparing a TestClass for execution, what happened when the TestClass was executed, and when the test environment was cleaned up. The RunLog is an Artifact, which can be downloaded and viewed.',
        searchPlaceholder: 'Find in run log',
        noMatches: 'No matches',
        matchCounter: '{current} of {total}',
        matchPrevious: 'Previous match',
        matchNext: 'Next match',
        matchCase: 'Match case',
        matchWholeWord: 'Match whole word',
        filtersMenuTitle: 'Hide / Show Content',
        filterError: 'Error',
        filterWarn: 'Warning',
        filterInfo: 'Info',
        filterDebug: 'Debug',
        filterTrace: 'Trace',
        downloadButton: 'Download Run Log',
      };
      return dummy[key] ?? key;
    };
  },
}));

// Mock Carbon Design System components
jest.mock('@carbon/react', () => ({
  Search: ({ placeholder, value, onChange, ...props }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
  Button: ({
    children,
    onClick,
    disabled,
    iconDescription,
    hasIconOnly,
    renderIcon,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={iconDescription}
      data-testid={
        hasIconOnly
          ? `icon-button-${iconDescription?.toLowerCase().replace(/\s+/g, '-')}`
          : 'button'
      }
      {...props}
    >
      {hasIconOnly ? iconDescription : children}
    </button>
  ),
  Checkbox: ({ id, labelText, checked, onChange }: any) => (
    <label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        data-testid={`checkbox-${labelText.toLowerCase()}`}
      />
      {labelText}
    </label>
  ),
  OverflowMenu: ({ children, iconDescription }: any) => (
    <div data-testid="overflow-menu" aria-label={iconDescription}>
      {children}
    </div>
  ),
}));

// Mock Carbon icons
jest.mock('@carbon/icons-react', () => ({
  Filter: () => <div>Filter</div>,
  ChevronUp: () => <div>ChevronUp</div>,
  ChevronDown: () => <div>ChevronDown</div>,
  CharacterSentenceCase: () => <div>CharacterSentenceCase</div>,
  TextUnderline: () => <div>TextUnderline</div>,
  CloudDownload: () => <div>CloudDownload</div>,
}));

// Mock window.getSelection API
const mockSelection = (startNode: Node, endNode: Node, startOffset = 0, endOffset = 0) => {
  const selection = {
    anchorNode: startNode,
    focusNode: endNode,
    anchorOffset: startOffset,
    focusOffset: endOffset,
    isCollapse: startNode === endNode,
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
  };

  // Override the global window.getSelection method
  window.getSelection = jest.fn().mockReturnValue(selection as unknown as Selection);
  return selection;
};

const sampleLogs = `2024-01-01 10:00:00 INFO Starting application
2024-01-01 10:00:01 DEBUG Initializing database connection
2024-01-01 10:00:02 ERROR Failed to connect to database
2024-01-01 10:00:03 WARN Connection retry attempt 1
2024-01-01 10:00:04 INFO Application started successfully
2024-01-01 10:00:05 TRACE Detailed execution trace
Multi-line continuation
2024-01-01 10:00:06 ERROR Another error occurred`;

describe('LogTab', () => {
  const scrollIntoViewMock = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with title and description', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByText('Run Log')).toBeInTheDocument();
      expect(screen.getByText(/A step-by-step log of what happened/)).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Find in run log')).toBeInTheDocument();
    });

    it('renders filter menu', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByTestId('overflow-menu')).toBeInTheDocument();
    });

    it('renders download button', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByTestId('icon-button-download-run-log')).toBeInTheDocument();
    });

    it('renders log content with line numbers', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText(/Starting application/)).toBeInTheDocument();
    });
  });

  describe('Initial State and Props', () => {
    it('scrolls to the specified initialLine on first render', async () => {
      const targetLineNumber = 4;

      // Mock the scrollIntoView function
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      render(<LogTab logs={sampleLogs} initialLine={targetLineNumber} />);

      // Wait for the line to appear
      await screen.findByText(/Connection retry attempt 1/i);
      const targetLineElement = screen.getByText(/Connection retry attempt 1/).closest('div');

      // Assert
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    });

    it('does not scroll if initialLine is out of bounds', async () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      render(<LogTab logs={sampleLogs} initialLine={999} />);

      await screen.findByText(/Starting application/);

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it('does not scroll if initialLine is 0', async () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      render(<LogTab logs={sampleLogs} initialLine={0} />);

      await screen.findByText(/Starting application/);

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
  });

  describe('Log Processing', () => {
    it('processes log lines and assigns correct levels', () => {
      render(<LogTab logs={sampleLogs} />);

      // Check that different log levels are rendered
      expect(screen.getByText(/Starting application/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to connect to database/)).toBeInTheDocument();
      expect(screen.getByText(/Connection retry attempt/)).toBeInTheDocument();
    });

    it('handles multi-line log entries', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByText(/Detailed execution trace/)).toBeInTheDocument();
      expect(screen.getByText(/Multi-line continuation/)).toBeInTheDocument();
    });

    it('assigns inherited log levels to continuation lines', () => {
      const logsWithContinuation = `2024-01-01 10:00:01 ERROR First error line
This is a continuation line
2024-01-01 10:00:02 INFO New info line`;

      render(<LogTab logs={logsWithContinuation} />);

      expect(screen.getByText(/First error line/)).toBeInTheDocument();
      expect(screen.getByText(/This is a continuation line/)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('renders all filter checkboxes', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByTestId('checkbox-error')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-warning')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-info')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-debug')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-trace')).toBeInTheDocument();
    });

    it('all filters are checked by default', () => {
      render(<LogTab logs={sampleLogs} />);

      expect(screen.getByTestId('checkbox-error')).toBeChecked();
      expect(screen.getByTestId('checkbox-warning')).toBeChecked();
      expect(screen.getByTestId('checkbox-info')).toBeChecked();
      expect(screen.getByTestId('checkbox-debug')).toBeChecked();
      expect(screen.getByTestId('checkbox-trace')).toBeChecked();
    });

    it('toggles filter when checkbox is clicked', async () => {
      render(<LogTab logs={sampleLogs} />);

      const errorCheckbox = screen.getByTestId('checkbox-error');
      expect(errorCheckbox).toBeChecked();

      fireEvent.click(errorCheckbox);
      expect(errorCheckbox).not.toBeChecked();
    });

    it('hides all content when all filters are unchecked', async () => {
      render(<LogTab logs={sampleLogs} />);

      // Uncheck all filters
      const checkboxes = [
        screen.getByTestId('checkbox-error'),
        screen.getByTestId('checkbox-warning'),
        screen.getByTestId('checkbox-info'),
        screen.getByTestId('checkbox-debug'),
        screen.getByTestId('checkbox-trace'),
      ];

      for (const checkbox of checkboxes) {
        fireEvent.click(checkbox);
      }

      // Content should be hidden (no line numbers visible)
      expect(screen.queryByText('1.')).not.toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('calls handleDownload when download button is clicked', async () => {
      render(<LogTab logs={sampleLogs} />);

      const downloadButton = screen.getByTestId('icon-button-download-run-log');
      fireEvent.click(downloadButton);

      expect(handleDownload).toHaveBeenCalledWith(sampleLogs, 'run.log');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty logs', () => {
      render(<LogTab logs="" />);

      expect(screen.getByText('Run Log')).toBeInTheDocument();
      expect(screen.queryByText('1.')).not.toBeInTheDocument();
    });

    it('handles logs without explicit levels', () => {
      const logsWithoutLevels = `Simple log line without level
Another line
Yet another line`;

      render(<LogTab logs={logsWithoutLevels} />);

      expect(screen.getByText(/Simple log line without level/)).toBeInTheDocument();
      expect(screen.getByText('1.')).toBeInTheDocument();
    });

    it('disables navigation buttons when no matches', async () => {
      render(<LogTab logs={sampleLogs} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

      await waitFor(() => {
        const nextButton = screen.getByTestId('icon-button-next-match');
        const prevButton = screen.getByTestId('icon-button-previous-match');

        expect(nextButton).toBeDisabled();
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Regular Expression Handling', () => {
    it('escapes special regex characters in search', async () => {
      const logsWithSpecialChars = `Line with (parentheses) and [brackets]
Line with $dollar and ^caret`;

      render(<LogTab logs={logsWithSpecialChars} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '(parentheses)' } });

      await waitFor(() => {
        expect(screen.getByText('1 of 1')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Edge Cases', () => {
    it('handles empty logs', () => {
      render(<LogTab logs="" />);

      expect(screen.getByText('Run Log')).toBeInTheDocument();
      expect(screen.queryByText('1.')).not.toBeInTheDocument();
    });

    it('handles logs without explicit levels by inheriting INFO', async () => {
      const logsWithoutLevels = `Simple log line without level\nAnother line`;

      render(<LogTab logs={logsWithoutLevels} />);

      // Check that the line is visible by default.
      await waitFor(() => {
        expect(screen.getByText(/Simple log line without level/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('checkbox-info'));

      await waitFor(() => {
        expect(screen.queryByText(/Simple log line/)).not.toBeInTheDocument();
      });
    });

    it('disables navigation buttons when no matches', async () => {
      render(<LogTab logs={sampleLogs} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

      await waitFor(() => {
        expect(screen.getByText('No matches')).toBeInTheDocument();
        expect(screen.getByTestId('icon-button-next-match')).toBeDisabled();
        expect(screen.getByTestId('icon-button-previous-match')).toBeDisabled();
      });
    });

    it('escapes special regex characters in search', async () => {
      const logsWithSpecialChars = `Line with $dollar and ^caret`;

      render(<LogTab logs={logsWithSpecialChars} />);

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: '$dollar' } });

      await waitFor(() => {
        // It should find exactly one match.
        expect(screen.getByText('1 of 1')).toBeInTheDocument();
      });
    });

    it('correctly assigns INFO level even if ERROR is in message content', async () => {
      const mixedLogs = `2024-01-01 10:00:01 INFO There is an ERROR inside this message`;
      render(<LogTab logs={mixedLogs} />);

      fireEvent.click(screen.getByTestId('checkbox-error'));
      await waitFor(() => {
        expect(screen.getByText(/There is an ERROR inside this message/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('checkbox-error'));
      fireEvent.click(screen.getByTestId('checkbox-info'));

      await waitFor(() => {
        expect(screen.queryByText(/There is an ERROR inside this message/)).not.toBeInTheDocument();
      });
    });

    describe('Debounce Functionality', () => {
      beforeAll(() => {
        jest.useFakeTimers();
      });

      afterAll(() => {
        jest.useRealTimers();
      });

      it('debounces the search input and updates after delay', async () => {
        render(<LogTab logs={sampleLogs} />);
        const searchInput = screen.getByTestId('search-input');

        fireEvent.change(searchInput, { target: { value: 'XYZ' } });

        // Before debounce delay, the match counter should not be updated.
        expect(screen.queryByText('No matches')).not.toBeInTheDocument();

        // Fast-forward time by debounce delay (300ms).
        jest.advanceTimersByTime(300);

        // Wait for the UI to update after debounced search.
        await waitFor(() => {
          expect(screen.getByText('No matches')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Selection and Permalink Functionality', () => {
    beforeEach(() => {
      // Mock the clipboard API for permalink tests
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });
    });

    it('copies permalink button is initially disabled', () => {
      render(<LogTab logs={sampleLogs} />);

      const copyPermalinkButton = screen.getByTestId('icon-button-copy-permalink');
      expect(copyPermalinkButton).toHaveClass('buttonDisabled');
    });

    it('enables permalink button when a log line is selected', async () => {
      render(<LogTab logs={sampleLogs} />);

      // Wait for the lines to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Starting application/)).toBeInTheDocument();
        expect(screen.getByText(/Failed to connect to database/)).toBeInTheDocument();
      });

      // Get lines selected nodes
      const startLineNode = screen.getByText(/Starting application/);
      const endLineNode = screen.getByText(/Failed to connect to database/);

      // Simulate selection
      mockSelection(startLineNode, endLineNode);

      // Trigger onMouseUp event on the container to process the selection
      fireEvent(document, new Event('selectionchange'));

      // Check if the permalink button is enabled
      await waitFor(() => {
        const copyPermalinkButton = screen.getByTestId('icon-button-copy-permalink');
        expect(copyPermalinkButton).not.toHaveClass('buttonDisabled');
      });
    });

    it('copies the correct permalink to the clipboard and disables the button', async () => {
      render(<LogTab logs={sampleLogs} />);
      await screen.findByText(/Initializing database connection/);

      const startLineNode = screen.getByText(/Initializing database connection/); // Line 2
      const endLineNode = screen.getByText(/Connection retry attempt 1/); // Line 4

      act(() => {
        // Simulate selection with offsets
        mockSelection(startLineNode, endLineNode, 5, 10);
        fireEvent(document, new Event('selectionchange'));
      });

      const copyButton = await screen.findByTestId('icon-button-copy-permalink');
      expect(copyButton).not.toHaveClass('buttonDisabled');

      // Click the button

      act(() => {
        fireEvent.click(copyButton);
      });

      // Verify the clipboard was called with the correct URL hash.
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('#log-2-5-4-10')
      );
      // The button should become disabled again after copying.
      await waitFor(() => {
        expect(copyButton).toHaveClass('buttonDisabled');
      });
    });
  });

  describe('URL Hash Handling', () => {
    beforeEach(() => {
      // Clear any existing hash
      window.history.replaceState({}, 'Test page', '/');
      scrollIntoViewMock.mockClear();

      // Mock document.getElementById to return mock elements
      const mockElement = {
        scrollIntoView: scrollIntoViewMock,
        querySelector: jest.fn().mockReturnValue({
          firstChild: {
            textContent: 'mock text content',
          },
        }),
      };

      jest.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id.startsWith('log-line-')) {
          return mockElement as any;
        }
        return null;
      });

      // Mock document.createRange and window.getSelection for the hash selection logic
      const mockRange = {
        setStart: jest.fn(),
        setEnd: jest.fn(),
      };

      const mockSelection = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      };

      document.createRange = jest.fn().mockReturnValue(mockRange as any);
      window.getSelection = jest.fn().mockReturnValue(mockSelection as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('scrolls to the line specified in the URL hash and highlights it', async () => {
      // Set the URL hash before rendering
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          hash: '#log-3-0-3-5',
        },
        writable: true,
      });

      render(<LogTab logs={sampleLogs} />);

      // Wait for the target line to be rendered and processed
      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to database/)).toBeInTheDocument();
      });

      // Wait for all effects to complete, including hash handling
      await waitFor(
        () => {
          expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'auto',
            block: 'center',
          });
        },
        { timeout: 2000 }
      );
    });

    it('scrolls to a new line when the hash changes', async () => {
      // Start with no hash
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          hash: '',
        },
        writable: true,
      });

      render(<LogTab logs={sampleLogs} />);

      // Wait for the content to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Starting application/)).toBeInTheDocument();
        expect(screen.getByText(/Application started successfully/)).toBeInTheDocument();
      });

      // Clear any previous scroll calls
      scrollIntoViewMock.mockClear();

      // Change the URL hash and trigger the event
      act(() => {
        Object.defineProperty(window, 'location', {
          value: {
            ...window.location,
            hash: '#log-5-0-5-5',
          },
          writable: true,
        });

        // Dispatch the hashchange event
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Wait for the hash change to be processed and scroll to occur
      await waitFor(
        () => {
          expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'auto',
            block: 'center',
          });
        },
        { timeout: 2000 }
      );
    });
  });
});
