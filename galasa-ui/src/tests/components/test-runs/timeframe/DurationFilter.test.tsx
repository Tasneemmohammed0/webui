/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DurationFilter from '@/components/test-runs/timeframe/DurationFilter';
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

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockHandleValueChange = jest.fn();

beforeEach(() => {
  // Reset the mock function before each test
  mockHandleValueChange.mockClear();
});

describe('DurationFilter', () => {
  test('render initially without crashing and number inputs enabled', () => {
    render(<DurationFilter values={mockValues} handleValueChange={mockHandleValueChange} />);

    expect(screen.getByTestId('duration-filter')).toBeInTheDocument();

    const daysInput = screen.getByLabelText('days');
    expect(daysInput).toBeInTheDocument();
    expect(daysInput).toBeEnabled();

    const hoursInput = screen.getByLabelText('hours');
    expect(hoursInput).toBeInTheDocument();
    expect(hoursInput).toBeEnabled();

    const minutesInput = screen.getByLabelText('minutes');
    expect(minutesInput).toBeInTheDocument();
    expect(minutesInput).toBeEnabled();
  });

  test('number inputs is disabled when disabled prop is true', () => {
    render(
      <DurationFilter
        values={mockValues}
        handleValueChange={mockHandleValueChange}
        disabled={true}
      />
    );

    const daysInput = screen.getByLabelText('days');
    expect(daysInput).toBeDisabled();

    const hoursInput = screen.getByLabelText('hours');
    expect(hoursInput).toBeDisabled();

    const minutesInput = screen.getByLabelText('minutes');
    expect(minutesInput).toBeDisabled();
  });

  test('should call handleValueChange when a NumberInput is changed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DurationFilter values={mockValues} handleValueChange={mockHandleValueChange} />);

    const minutesInput = screen.getByLabelText('minutes');

    // Act: Change the value of the minutes input
    await user.clear(minutesInput);
    await user.type(minutesInput, '45');
    await user.tab();

    // Assert: Check that the callback was fired with the final, correct value.
    expect(mockHandleValueChange).toHaveBeenLastCalledWith('durationMinutes', '45');
  });
});
