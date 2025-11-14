/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import SearchCriteriaContent from '@/components/test-runs/search-criteria/SearchCriteriaContent';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// Mock child components
jest.mock('@/components/test-runs/search-criteria/CustomSearchComponent', () => {
  return function MockCustomSearchComponent(props: any) {
    return (
      <div data-testid="mock-custom-search-component">
        <p>{props.title}</p>
        <input
          data-testid="search-input"
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
        />
        <button onClick={props.onSubmit} disabled={props.disableSaveAndReset}>
          Submit
        </button>
        <button onClick={props.onCancel}>Cancel</button>
        <button onClick={props.onClear}>Clear</button>
      </div>
    );
  };
});

jest.mock('@/components/test-runs/search-criteria/CustomCheckBoxList', () => {
  return function MockCustomCheckBoxList(props: any) {
    return (
      <div data-testid="mock-custom-checkbox-list">
        <p>{props.title}</p>
        {props.items.map((item: string) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={props.selectedItems.includes(item)}
              onChange={(e) =>
                props.onChange(
                  e.target.checked
                    ? [...props.selectedItems, item]
                    : props.selectedItems.filter((i: string) => i !== item)
                )
              }
            />
            {item}
          </label>
        ))}
        <button onClick={props.onSubmit}>Submit</button>
        <button onClick={props.onCancel}>Cancel</button>
      </div>
    );
  };
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      description: 'Edit search criteria to describe the test results you wish to view',
      'table.columnName': 'Column Name',
      'table.allowedValues': 'Allowed Values',
      'fields.runName.label': 'Test Run Name',
      'fields.runName.description': 'Description for Test Run Name',
      'fields.requestor.label': 'Requestor',
      'fields.requestor.description': 'Description for Requestor',
      'fields.group.label': 'Group',
      'fields.group.description': 'Description for Group',
      'fields.bundle.label': 'Bundle',
      'fields.bundle.description': 'Description for Bundle',
      'fields.submissionId.label': 'Submission ID',
      'fields.submissionId.description': 'Description for Submission ID',
      'fields.testName.label': 'Test Name',
      'fields.testName.description': 'Description for Test Name',
      'fields.status.label': 'Status',
      'fields.status.description': 'Description for Status',
      'fields.tags.label': 'Tags',
      'fields.tags.description': 'Description for Tags',
      'fields.result.label': 'Result',
      'fields.result.description': 'Description for Result',
      clearFilters: 'Clear Filters',
    };
    return translations[key] || key;
  },
}));

// Helper function to render a stateful wrapper.
const SearchCriteriaTestWrapper = ({
  initialCriteria = {},
}: {
  initialCriteria?: Record<string, string>;
}) => {
  const [criteria, setCriteria] = useState(initialCriteria);
  const requestorNamesPromise = Promise.resolve(['req1', 'req2']);
  const resultsNamesPromise = Promise.resolve(['result1', 'result2']);

  return (
    <SearchCriteriaContent
      requestorNamesPromise={requestorNamesPromise}
      resultsNamesPromise={resultsNamesPromise}
      searchCriteria={criteria}
      setSearchCriteria={setCriteria}
    />
  );
};

// Mock searchCriteria
const mockSearchCriteria = {
  runName: 'MyRun',
  status: 'Passed, Failed',
};
const mockSetSearchCriteria = jest.fn();

describe('SearchCriteriaContent', () => {
  const requestorNamesPromise = Promise.resolve(['req1', 'req2']);
  const resultsNamesPromise = Promise.resolve(['result1', 'result2']);

  // Reset mocks and params for each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly and selects the first filter by default', () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    expect(screen.getByText(/Edit search criteria/i)).toBeInTheDocument();
    expect(screen.getByText('Column Name')).toBeInTheDocument();
    expect(screen.getByText('Allowed Values')).toBeInTheDocument();

    // Check if the first filter is selected by default
    const testRunNameRow = screen.getByText('Test Run Name').closest('[role="row"]');
    expect(testRunNameRow).toBeInTheDocument();

    const rowWrapperDiv = testRunNameRow?.querySelector('.rowWrapper');
    expect(rowWrapperDiv).toBeInTheDocument();
    expect(rowWrapperDiv).toHaveClass('selectedRow');

    expect(screen.getByTestId('mock-custom-search-component')).toBeInTheDocument();
  });

  test('initialize state from Search Criteria props', async () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('MyRun')).toBeInTheDocument();
      expect(screen.getByText('Passed, Failed')).toBeInTheDocument();
    });
  });

  test('switching the rendered component when a different filter is clicked', async () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    // Initially, search component is visible
    expect(screen.getByTestId('mock-custom-search-component')).toBeInTheDocument();

    // Click on the 'status' row
    const statusRow = screen.getByText('Status').closest('div') || document.createElement('div');
    fireEvent.click(statusRow);

    // Checkbox list component should be visible
    const checkBoxComponent = await screen.findByTestId('mock-custom-checkbox-list');
    expect(checkBoxComponent).toBeInTheDocument();
  });

  test('saves a new value and updates the parent props', async () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    // Find the input and submit button within the mocked component
    const searchComponent = screen.getByTestId('mock-custom-search-component');
    const input = within(searchComponent).getByTestId('search-input');
    const submitButton = within(searchComponent).getByText('Submit');

    // Simulate user typing a new value
    fireEvent.change(input, { target: { value: 'New Test Run' } });

    // Simulate form submission
    fireEvent.click(submitButton);

    // Check that the parent function was called with the new value
    expect(mockSetSearchCriteria).toHaveBeenCalledWith({
      ...mockSearchCriteria,
      runName: 'New Test Run',
    });
  });

  test('cancels an edit and reverts the input value', async () => {
    render(<SearchCriteriaTestWrapper initialCriteria={mockSearchCriteria} />);

    // Find the input and buttons within the mocked component
    const searchComponent = screen.getByTestId('mock-custom-search-component');
    const input = within(searchComponent).getByTestId('search-input');
    const cancelButton = within(searchComponent).getByText('Cancel');

    expect(input).toHaveValue('MyRun');

    // Simulate user tyuping a value and canel it
    fireEvent.change(input, { target: { value: 'Cancel this value' } });
    fireEvent.click(cancelButton);

    // Check that the input is reverted
    await waitFor(() => {
      expect(input).toHaveValue('MyRun');
    });
  });

  test('removes a parameter from the search criteria props when the clear action is triggered', () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    // Find the clear button within the mocked component
    const searchComponent = screen.getByTestId('mock-custom-search-component');
    const clearButton = within(searchComponent).getByText('Clear');

    fireEvent.click(clearButton);

    // Check that the parent function was called to clear the search criteria
    expect(mockSetSearchCriteria).toHaveBeenCalledWith({
      ...mockSearchCriteria,
      runName: undefined,
    });
  });

  test('removes a parameter from the search criteria props if its value is cleared and saved', () => {
    render(
      <SearchCriteriaContent
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    // Find the input and submit button within the mocked component
    const searchComponent = screen.getByTestId('mock-custom-search-component');
    const input = within(searchComponent).getByTestId('search-input');
    const submitButton = within(searchComponent).getByText('Submit');

    // Clear the input value
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    // Check that the parent function was called to remove the parameter
    expect(mockSetSearchCriteria).toHaveBeenCalledWith({
      ...mockSearchCriteria,
      runName: undefined,
    });
  });

  test('handles pending promises without crashing', () => {
    // Create promises that never resolve for this test
    const pendingRequestors: Promise<string[]> = new Promise(() => {});
    const pendingResults: Promise<string[]> = new Promise(() => {});

    render(
      <SearchCriteriaContent
        requestorNamesPromise={pendingRequestors}
        resultsNamesPromise={pendingResults}
        searchCriteria={mockSearchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );

    // Check that the UI renders correctly even with pending promises
    expect(
      screen.getByText('Edit search criteria to describe the test results you wish to view')
    ).toBeInTheDocument();

    // Switch to a filter that depends on a promise
    const requestorRow =
      screen.getByText('Requestor').closest('[role="row"]') || document.createElement('div');
    fireEvent.click(requestorRow);

    // The component should still render its structure
    expect(screen.getByTestId('mock-custom-search-component')).toBeInTheDocument();
  });

  test('save button is disabled when state is not changed, and enabled when changed', async () => {
    render(<SearchCriteriaTestWrapper initialCriteria={{ runName: 'InitialValue' }} />);

    const searchComponent = screen.getByTestId('mock-custom-search-component');
    const input = within(searchComponent).getByTestId('search-input');
    const submitButton = within(searchComponent).getByText('Submit');

    expect(submitButton).toBeDisabled();

    // Type a new value
    fireEvent.change(input, { target: { value: 'New Value' } });
    expect(submitButton).toBeEnabled();

    // Save the new value
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Type new value, The button should be enabled.
    fireEvent.change(input, { target: { value: 'Another Value' } });
    expect(submitButton).toBeEnabled();
  });

  test('clear all filters when the "Clear Filters" button is clicked', async () => {
    render(
      <SearchCriteriaTestWrapper initialCriteria={{ runName: 'InitialValue', result: 'Passed' }} />
    );

    const clearFiltersButton = screen.getByRole('button', { name: /Clear Filters/i });

    const testRunNameRow = screen.getByText('Test Run Name').closest('[role="row"]') as HTMLElement;
    const resultRow = screen.getByText('Result').closest('[role="row"]') as HTMLElement;

    await waitFor(() => {
      expect(within(testRunNameRow).getByText('InitialValue')).toBeInTheDocument();
      expect(within(resultRow).getByText('Passed')).toBeInTheDocument();
    });

    // Clear all filters
    fireEvent.click(clearFiltersButton);

    await waitFor(() => {
      expect(within(testRunNameRow).queryByText('InitialValue')).not.toBeInTheDocument();
      expect(within(testRunNameRow).getByText('any')).toBeInTheDocument();
      expect(within(resultRow).getByText('any')).toBeInTheDocument();
    });
  });

  test('"Clear Filters" button is enabled with filters and becomes disabled after being clicked', async () => {
    const user = userEvent.setup();

    render(
      <SearchCriteriaTestWrapper initialCriteria={{ runName: 'MyRun', status: 'Passed, Failed' }} />
    );

    const clearFiltersButton = screen.getByRole('button', { name: /Clear Filters/i });
    expect(clearFiltersButton).toBeEnabled();

    // Check that the filter value is displayed
    expect(screen.getByText('MyRun')).toBeInTheDocument();
    expect(screen.getByText('Passed, Failed')).toBeInTheDocument();

    //The user clicks the button to clear filters
    await user.click(clearFiltersButton);

    // The button should now be disabled because the state was cleared
    await waitFor(() => {
      expect(clearFiltersButton).toBeDisabled();
    });

    // Assert the filter values are cleared from the UI
    expect(screen.queryByText('MyRun')).not.toBeInTheDocument();
    expect(screen.queryByText('Passed, Failed')).not.toBeInTheDocument();
  });
});
