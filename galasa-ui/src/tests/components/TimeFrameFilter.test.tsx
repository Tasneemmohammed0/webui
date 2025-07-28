/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TimeFrameFilter from '@/components/test-runs/TimeFrameFilter';
import { TimeFrameValues } from '@/utils/interfaces';
import userEvent from '@testing-library/user-event';

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


jest.mock("next-intl", () => ({
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
      <TimeFrameFilter values={mockValues} handleValueChange={mockHandleValueChange} />
    );

    // Assert: check if the component renders correctly with the mocked values
    const fromGroup = screen.getByRole('group', { name: /from/i });

    expect(within(fromGroup).getByLabelText(/date/i)).toHaveValue('10/01/2023');
    expect(within(fromGroup).getByLabelText(/time/i)).toHaveValue('10:00');

    const durationGroup = screen.getByRole('group', { name: /duration/i });
    expect(within(durationGroup).getByLabelText(/days/i)).toHaveValue(1);
    expect(within(durationGroup).getByLabelText(/hours/i)).toHaveValue(10);
  });

  test('should call handleValueChange when a date is selected from the calendar', async () => {
    const user = userEvent.setup();
    // Act
    render(
      <TimeFrameFilter values={mockValues} handleValueChange={mockHandleValueChange} />
    );

    // Assert: check if mockHandleValueChange is called with the correct parameters when the date input changes
    const fromGroup = screen.getByRole('group', { name: /from/i });
    const dateInput = within(fromGroup).getByLabelText(/date/i);

    await user.clear(dateInput);
    await user.type(dateInput, '10/25/2023');
    await user.tab();


    expect(mockHandleValueChange).toHaveBeenCalled();
    console.log(mockHandleValueChange.mock.calls);
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
      <TimeFrameFilter values={mockValues} handleValueChange={mockHandleValueChange} />
    );

    // Assert: check if mockHandleValueChange is called with the correct parameters when the time input changes
    const fromGroup = screen.getByRole('group', { name: /from/i });
    const amPmSelect = within(fromGroup).getAllByRole('combobox')[0];

    await user.selectOptions(amPmSelect, 'PM');

    expect(mockHandleValueChange).toHaveBeenCalledWith('fromAmPm', 'PM');
  });

  test('should call handleValueChange when a NumberInput is changed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TimeFrameFilter values={mockValues} handleValueChange={mockHandleValueChange} />);

    const minutesInput = screen.getByLabelText('minutes');

    // Act: Change the value of the minutes input
    await user.clear(minutesInput);
    await user.type(minutesInput, '45');
    await user.tab();

    // Assert: Check that the callback was fired with the final, correct value.
    expect(mockHandleValueChange).toHaveBeenLastCalledWith('durationMinutes', '45');
  });
});