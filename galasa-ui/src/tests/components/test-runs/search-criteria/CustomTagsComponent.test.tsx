/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomTagsComponent from '@/components/test-runs/search-criteria/CustomTagsComponent';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      save: 'Save',
      cancel: 'Cancel',
      add: 'Add',
      remove: 'Remove',
    };
    return translations[key] || key;
  },
}));

describe('CustomTagsComponent', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn((e) => e.preventDefault());
  const mockOnCancel = jest.fn();

  const defaultProps = {
    title: 'Manage Your Tags',
    tags: ['existing-tag-1', 'existing-tag-2'],
    placeholder: 'any',
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    disableSaveAndReset: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with initial props', () => {
    render(<CustomTagsComponent {...defaultProps} />);

    expect(screen.getByText('Manage Your Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('any')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();

    // Check for existing tags in the listbox
    expect(screen.getByRole('option', { name: 'existing-tag-1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'existing-tag-2' })).toBeInTheDocument();

    // Remove button should be disabled initially
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  test('allows adding a new tag via the "Add" button and clears the input', () => {
    const { rerender } = render(<CustomTagsComponent {...defaultProps} />);

    const input = screen.getByPlaceholderText('any');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // User types a new tag
    fireEvent.change(input, { target: { value: 'new-tag' } });
    fireEvent.click(addButton);

    // Assert that onChange was called correctly
    expect(mockOnChange).toHaveBeenCalledWith(['existing-tag-1', 'existing-tag-2', 'new-tag']);

    // Assert input is cleared immediately
    expect(input).toHaveValue('');

    const updatedProps = { ...defaultProps, tags: ['existing-tag-1', 'existing-tag-2', 'new-tag'] };
    rerender(<CustomTagsComponent {...updatedProps} />);

    // Assert the DOM has updated
    expect(screen.getByRole('option', { name: 'new-tag' })).toBeInTheDocument();
  });

  test('Does not allow adding an empty tag', () => {
    render(<CustomTagsComponent {...defaultProps} />);

    const input = screen.getByPlaceholderText('any');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(addButton);

    // No new tag should be added
    expect(screen.queryByRole('option', { name: '' })).not.toBeInTheDocument();
  });

  test('allows selecting and removing tags', () => {
    const { rerender } = render(<CustomTagsComponent {...defaultProps} />);

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    const listbox = screen.getByRole('listbox');
    fireEvent.change(listbox, { target: { value: 'existing-tag-1' } });

    //  Assert the remove button is enabled after selecting a tag
    expect(removeButton).toBeEnabled();
    fireEvent.click(removeButton);

    //  Assert onChange was called with the filtered list
    expect(mockOnChange).toHaveBeenCalledWith(['existing-tag-2']);

    // Simulate parent re-rendering with the updated list
    rerender(<CustomTagsComponent {...defaultProps} tags={['existing-tag-2']} />);

    // Assert the DOM has updated
    expect(screen.queryByRole('option', { name: 'existing-tag-1' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'existing-tag-2' })).toBeInTheDocument();
    // After removal, the remove button should be disabled again
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  test('calls onSubmit when the save button is clicked', () => {
    render(<CustomTagsComponent {...defaultProps} />);
    const saveButton = screen.getByRole('button', { name: 'Save' });

    fireEvent.click(saveButton);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
