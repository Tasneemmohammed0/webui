/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TimeFrameFilter from '@/components/test-runs/timeframe/TimeFrameFilter';
import { TimeFrameValues } from '@/utils/interfaces';
import userEvent from '@testing-library/user-event';
import { fromToSelectionEnum } from '@/components/test-runs/timeframe/TimeFrameContent';

const mockValues: TimeFrameValues = {
  fromDate: new Date('2023-10-01'),
  fromTime: '10:00',
  fromAmPm: 'AM',
  toDate: new Date('2023-10-02'),
  toTime: '02:00',
  toAmPm: 'PM',
  durationDays: 1,
  durationHours: 10,
  durationMinutes: 0,
};

const mockHandleValueChange = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the DateTimeFormatContext to provide a default format
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => ({
    preferences: { locale: 'en-US' },
  }),
}));

beforeEach(() => {
  // Reset the mock function before each test
  mockHandleValueChange.mockClear();
});

describe('TimeFrameFilter', () => {
  test('initial render and prop display', () => {
    // Act: render the component with the mock values
    render(
      <TimeFrameFilter
        values={mockValues}
        handleValueChange={mockHandleValueChange}
        fromToSelection={fromToSelectionEnum.FromSelectionOptions}
      />
    );

    // Assert: check if the component renders correctly with the mocked values
    const fromContainer = screen.getByTestId('from-timeframe-filter');

    expect(within(fromContainer).getByLabelText(/date/i)).toHaveValue('10/01/2023');
    expect(within(fromContainer).getByLabelText(/time/i)).toHaveValue('10:00');
  });

  test('should call handleValueChange when a date is selected from the calendar', async () => {
    const user = userEvent.setup();
    // Act
    render(
      <TimeFrameFilter
        values={mockValues}
        handleValueChange={mockHandleValueChange}
        fromToSelection={fromToSelectionEnum.FromSelectionOptions}
      />
    );

    // Assert: check if mockHandleValueChange is called with the correct parameters when the date input changes
    const fromContainer = screen.getByTestId('from-timeframe-filter');
    const dateInput = within(fromContainer).getByLabelText(/date/i);

    await user.clear(dateInput);
    await user.type(dateInput, '10/25/2023');
    await user.tab();

    expect(mockHandleValueChange).toHaveBeenCalled();
    const calledDate = mockHandleValueChange.mock.calls[0][1];

    expect(calledDate).toBeInstanceOf(Date);
    expect(calledDate.getDate()).toBe(25);
    expect(calledDate.getMonth()).toBe(9);
    expect(calledDate.getFullYear()).toBe(2023);
  });

  test('should call handleValueChange when AM/PM select is changed', async () => {
    const user = userEvent.setup();
    // Act
    render(
      <TimeFrameFilter
        values={mockValues}
        handleValueChange={mockHandleValueChange}
        fromToSelection={fromToSelectionEnum.FromSelectionOptions}
      />
    );

    // Assert: check if mockHandleValueChange is called with the correct parameters when the time input changes
    const fromContainer = screen.getByTestId('from-timeframe-filter');
    const amPmSelect = within(fromContainer).getAllByRole('combobox')[0];

    await user.selectOptions(amPmSelect, 'PM');

    expect(mockHandleValueChange).toHaveBeenCalledWith('fromAmPm', 'PM');
  });

  test('should be disabled when "disabled" prop is passed', () => {
    render(
      <TimeFrameFilter
        values={mockValues}
        handleValueChange={mockHandleValueChange}
        fromToSelection={fromToSelectionEnum.FromSelectionOptions}
        disabled={true}
      />
    );
    const fromContainer = screen.getByTestId('from-timeframe-filter');
    const dateInput = within(fromContainer).getByLabelText(/date/i);
    const timeInput = within(fromContainer).getByLabelText(/time/i);
    const amPmSelect = within(fromContainer).getAllByRole('combobox')[0];

    expect(dateInput).toBeDisabled();
    expect(timeInput).toBeDisabled();
    expect(amPmSelect).toBeDisabled();
  });
});
