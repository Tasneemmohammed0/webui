/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomCheckBoxList from '@/components/test-runs/search-criteria/CustomCheckBoxList';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      save: 'Save',
      reset: 'Reset',
    };
    return translations[key] || key;
  },
}));

describe('CustomCheckBoxList', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn((e) => e.preventDefault());
  const mockOnCancel = jest.fn();

  const defaultProps = {
    title: 'Select Items',
    items: ['Item A', 'Item B', 'Item C'],
    selectedItems: ['Item A'],
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    disableSaveAndReset: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with initial state', () => {
    render(<CustomCheckBoxList {...defaultProps} />);
    expect(screen.getByText('Select Items')).toBeInTheDocument();

    // Check the initially selected item is checked
    expect(screen.getByLabelText('Item A')).toBeChecked();

    // Check that an unselected item is not checked
    expect(screen.getByLabelText('Item B')).not.toBeChecked();
  });

  test('calls onChange when an unchecked item is clicked', () => {
    render(<CustomCheckBoxList {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Item B'));

    // It should add the new item to the existing selection
    expect(mockOnChange).toHaveBeenCalledWith(['Item A', 'Item B']);
  });

  test('calls onChange when a checked item is clicked', () => {
    render(<CustomCheckBoxList {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Item A'));

    // It should remove the item from the selection
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  test('calls onSubmit when the save button is clicked', () => {
    render(<CustomCheckBoxList {...defaultProps} />);
    const saveButton = screen.getByRole('button', { name: 'Save' });

    fireEvent.click(saveButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    // Ensure other callbacks were not triggered
    expect(mockOnCancel).not.toHaveBeenCalled();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('handles multiple selection changes correctly in sequence', () => {
    const { rerender } = render(<CustomCheckBoxList {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Item B'));
    expect(mockOnChange).toHaveBeenLastCalledWith(['Item A', 'Item B']);

    rerender(<CustomCheckBoxList {...defaultProps} selectedItems={['Item A', 'Item B']} />);

    fireEvent.click(screen.getByLabelText('Item C'));
    expect(mockOnChange).toHaveBeenLastCalledWith(['Item A', 'Item B', 'Item C']);

    rerender(
      <CustomCheckBoxList {...defaultProps} selectedItems={['Item A', 'Item B', 'Item C']} />
    );

    fireEvent.click(screen.getByLabelText('Item A'));
    expect(mockOnChange).toHaveBeenLastCalledWith(['Item B', 'Item C']);
  });

  test('when checking `All` and then unchecking an item, `All` should be unchecked', () => {
    const { rerender } = render(<CustomCheckBoxList {...defaultProps} />);

    // Check 'All'
    fireEvent.click(screen.getByLabelText('All'));
    expect(mockOnChange).toHaveBeenCalledWith(['Item A', 'Item B', 'Item C']);

    rerender(
      <CustomCheckBoxList {...defaultProps} selectedItems={['Item A', 'Item B', 'Item C']} />
    );

    // Uncheck 'Item A'
    expect(screen.getByLabelText('All')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Item A'));
    expect(mockOnChange).toHaveBeenCalledWith(['Item B', 'Item C']);

    rerender(<CustomCheckBoxList {...defaultProps} selectedItems={['Item B', 'Item C']} />);

    // Check that 'All' is now unchecked
    expect(screen.getByLabelText('All')).not.toBeChecked();
  });

  test('clicking Reset calls the onCancel prop and does not change selection', () => {
    const initialSelection = ['Item A'];
    const { rerender } = render(
      <CustomCheckBoxList {...defaultProps} selectedItems={initialSelection} />
    );

    // Check "All" checkbox
    fireEvent.click(screen.getByLabelText('All'));
    expect(mockOnChange).toHaveBeenCalledWith(['Item A', 'Item B', 'Item C']);

    rerender(
      <CustomCheckBoxList {...defaultProps} selectedItems={['Item A', 'Item B', 'Item C']} />
    );
    expect(screen.getByLabelText('All')).toBeChecked();

    // Click "Cancel".
    const cancelButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(cancelButton);

    // Assert that onCancel was called.
    expect(mockOnCancel).toHaveBeenCalledTimes(1);

    // Simulate a rerender to check if the selection is reverted.
    rerender(<CustomCheckBoxList {...defaultProps} selectedItems={initialSelection} />);

    // Assert the UI has been reverted correctly.
    expect(screen.getByLabelText('Item A')).toBeChecked();
    expect(screen.getByLabelText('Item B')).not.toBeChecked();
    expect(screen.getByLabelText('All')).not.toBeChecked();
  });
});
