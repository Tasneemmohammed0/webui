/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomSearchComponent from '@/components/test-runs/search-criteria/CustomSearchComponent';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      save: 'Save',
      reset: 'Reset',
    };
    return translations[key] || key;
  },
}));

describe('CustomSearchComponent', () => {
  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();
  const mockOnSubmit = jest.fn((e) => e.preventDefault());
  const mockOnCancel = jest.fn();
  const allRequestors = ['John Doe', 'Jane Smith', 'Peter Jones'];

  const defaultProps = {
    title: 'Search by Requestor',
    placeholder: 'Enter a requestor name',
    value: '',
    onChange: mockOnChange,
    onClear: mockOnClear,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    disableSaveAndReset: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly without suggestions', () => {
    render(<CustomSearchComponent {...defaultProps} />);

    expect(screen.getByText('Search by Requestor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a requestor name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('shows suggestions when allRequestors is provided and input value matches', () => {
    render(<CustomSearchComponent {...defaultProps} allRequestors={allRequestors} />);

    const searchInput = screen.getByPlaceholderText('Enter a requestor name');
    fireEvent.focus(searchInput);

    const suggestionList = screen.getByRole('list');
    expect(suggestionList).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('filters suggestions based on input value', () => {
    render(<CustomSearchComponent {...defaultProps} value="Jan" allRequestors={allRequestors} />);

    const searchInput = screen.getByPlaceholderText('Enter a requestor name');
    fireEvent.focus(searchInput);

    const suggestionList = screen.getByRole('list');
    expect(suggestionList).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('selects a suggestion on mouse down and hides the list', () => {
    render(<CustomSearchComponent {...defaultProps} allRequestors={allRequestors} />);
    const input = screen.getByPlaceholderText('Enter a requestor name');

    fireEvent.focus(input);
    const suggestionItem = screen.getByText('Peter Jones');

    fireEvent.mouseDown(suggestionItem);

    // Verify onChange was called with the correct value
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { value: 'Peter Jones' },
      })
    );

    // The list should now be hidden
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('calls onchange when the user types in the input', () => {
    render(<CustomSearchComponent {...defaultProps} allRequestors={allRequestors} />);

    const input = screen.getByPlaceholderText('Enter a requestor name');
    fireEvent.change(input, { target: { value: 'Jane' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('calls onClear when the clear button is clicked', () => {
    render(<CustomSearchComponent {...defaultProps} value="some value" />);
    const clearButton = screen.getByLabelText('Clear search input');

    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  test('calls onSubmit when the form is submitted', () => {
    render(<CustomSearchComponent {...defaultProps} />);
    const form = screen.getByTestId('custom-search-form');
    fireEvent.submit(form);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when the reset button is clicked', () => {
    render(<CustomSearchComponent {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Reset' });

    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('disables save button when input is unchanged and enables it when changed', () => {
    const { rerender } = render(
      <CustomSearchComponent {...defaultProps} value="test" disableSaveAndReset={false} />
    );
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeEnabled();

    rerender(<CustomSearchComponent {...defaultProps} value="test" disableSaveAndReset={true} />);
    expect(saveButton).toBeDisabled();

    rerender(
      <CustomSearchComponent {...defaultProps} value="new value" disableSaveAndReset={false} />
    );
    expect(saveButton).toBeEnabled();

    rerender(<CustomSearchComponent {...defaultProps} value="" disableSaveAndReset={false} />);
    expect(saveButton).toBeEnabled();
  });

  test('selects a highlighted suggestion with Enter key using key down', () => {
    render(<CustomSearchComponent {...defaultProps} allRequestors={allRequestors} />);

    const searchInput = screen.getByPlaceholderText('Enter a requestor name');
    fireEvent.focus(searchInput);

    // Navigate to the second item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown', code: 'ArrowDown' });

    // Press enter
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    // Check that onchange was called with the selected value
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { value: 'Jane Smith' },
      })
    );
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
