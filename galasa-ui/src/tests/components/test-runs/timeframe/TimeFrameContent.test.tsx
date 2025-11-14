/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimeFrameContent, {
  applyTimeFrameRules,
  calculateSynchronizedState,
} from '@/components/test-runs/timeframe/TimeFrameContent';
import { addMonths } from '@/utils/timeOperations';
import { DAY_MS } from '@/utils/constants/common';
import { TimeFrameValues } from '@/utils/interfaces';
import { useState } from 'react';

// Mock next-intl to prevent ESM parsing errors in Jest
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      toBeforeFromWarningOnly:
        "'From' time is set to the future. Current query will return no results.",
      dateRangeCapped: 'Date range was capped at the current time.',
      dateRangeExceeded: "Date range cannot exceed 3 months; 'To' date has been adjusted.",
      invalidTimeFrame: 'Invalid Time Frame',
      autoCorrection: 'Auto-Correction',
      specificTimeTitle: 'A specific time',
      durationTitle: "Duration before 'To' time",
      nowTitle: 'Now',
      nowDescription: 'The time the query results are viewed or refreshed',
    };
    return translations[key] || key;
  },
}));

// Mock the DurationFilter component
jest.mock('@/components/test-runs/timeframe/DurationFilter', () => {
  const DurationFilterMock = (props: any) => {
    return (
      <div data-testid="duration-filter">
        <p>duration</p>
        <input type="number" value={props.values.durationDays} aria-label="days" />
        <input type="number" value={props.values.durationHours} aria-label="hours" />
        <input type="number" value={props.values.durationMinutes} aria-label="minutes" />
      </div>
    );
  };
  return DurationFilterMock;
});

const mockTranslator = (key: string, values?: Record<string, any>) => {
  if (key === 'toBeforeFrom') return "'To' date cannot be before 'From' date.";
  if (key === 'dateRangeCapped') return 'Date range was capped at the current time.';
  if (key === 'dateRangeExceeded' && values) {
    return `Date range cannot exceed ${values.maxMonths} months; 'To' date has been adjusted.`;
  }
  return key;
};

// Mock the child component to prevent its internal logic from running
jest.mock('@/components/test-runs/timeframe/TimeFrameFilter', () => {
  const TimeFrameFilterMock = (props: any) => (
    <div data-testid="timeframe-filter">
      <label htmlFor="from-date">From Date</label>
      <input
        id="from-date"
        value={props.values.fromDate.toLocaleDateString('en-US')}
        onChange={(e) => props.handleValueChange('fromDate', new Date(e.target.value))}
      />
      <label htmlFor="duration-days">Days</label>
      <input
        type="number"
        id="duration-days"
        value={props.values.durationDays}
        onChange={(e) => props.handleValueChange('durationDays', parseInt(e.target.value, 10))}
      />
      <label htmlFor="duration-hours">Hours</label>
      <input
        type="number"
        id="duration-hours"
        value={props.values.durationHours}
        onChange={(e) => props.handleValueChange('durationHours', parseInt(e.target.value, 10))}
      />
      <label htmlFor="duration-minutes">Minutes</label>
      <input
        type="number"
        id="duration-minutes"
        value={props.values.durationMinutes}
        onChange={(e) => props.handleValueChange('durationMinutes', parseInt(e.target.value, 10))}
      />
      <label htmlFor="to-date">To Date</label>
      <input
        id="to-date"
        value={props.values.toDate.toLocaleDateString('en-US')}
        onChange={(e) => props.handleValueChange('toDate', new Date(e.target.value))}
      />
    </div>
  );

  return TimeFrameFilterMock;
});

// Mock the DateTimeFormatContext
jest.mock('@/contexts/DateTimeFormatContext', () => ({
  useDateTimeFormat: () => ({
    getResolvedTimeZone: () => 'UTC',
  }),
}));

const timezone = 'UTC';
describe('applyTimeFrameRules', () => {
  // A default "now" for tests that need to check against the current time.
  const MOCK_NOW = new Date('2025-08-20T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return null notification for a valid date range in the past', () => {
    jest.setSystemTime(MOCK_NOW);
    const fromDate = new Date('2025-08-15T10:00:00.000Z');
    const toDate = new Date('2025-08-17T10:00:00.000Z');
    const { notification, correctedTo } = applyTimeFrameRules(
      fromDate,
      toDate,
      false,
      mockTranslator
    );

    expect(notification).toBeNull();
    expect(correctedTo).toEqual(toDate);
  });

  test('should return null notification if "To" date is exactly "now"', () => {
    jest.setSystemTime(MOCK_NOW);
    const fromDate = new Date('2025-08-15T10:00:00.000Z');
    const { notification } = applyTimeFrameRules(fromDate, MOCK_NOW, false, mockTranslator);

    expect(notification).toBeNull();
  });

  test('should return an error if "From" date is after "To" date', () => {
    const fromDate = new Date('2025-08-15T10:00:00.000Z');
    const toDate = new Date('2025-08-14T10:00:00.000Z');
    const { correctedFrom, correctedTo, notification } = applyTimeFrameRules(
      fromDate,
      toDate,
      false,
      mockTranslator
    );

    expect(notification?.kind).toEqual('error');
    expect(notification?.text).toEqual('toBeforeFromErrorMessage');

    // Ensure 'To' and 'From' dates are not changed
    expect(correctedFrom).toEqual(fromDate);
    expect(correctedTo).toEqual(toDate);
  });

  test('should return a warning if "From" date is after the current time when isRelativeToNow prop is true', () => {
    const fromDate = new Date('2025-08-15T10:00:00.000Z');
    const toDate = new Date('2025-08-14T10:00:00.000Z');
    const { correctedFrom, correctedTo, notification } = applyTimeFrameRules(
      fromDate,
      toDate,
      true,
      mockTranslator
    );

    expect(notification?.kind).toEqual('warning');
    expect(notification?.text).toEqual('toBeforeFromWarningOnly');

    // Ensure nothing changes
    expect(correctedFrom).toEqual(fromDate);
    expect(correctedTo).toEqual(toDate);
  });

  test('should return null notification if "From" and "To" dates are the same', () => {
    jest.setSystemTime(new Date('2025-09-01T00:00:00.000Z'));
    const sameDate = new Date('2025-08-15T10:00:00.000Z');
    const { notification } = applyTimeFrameRules(sameDate, sameDate, false, mockTranslator);

    expect(notification).toBeNull();
  });

  describe('calculateSynchronizedState', () => {
    test('should correctly calculate a duration of excactly 1 day', () => {
      const fromDate = new Date('2025-08-15T10:00:00.000Z');
      const toDate = new Date('2025-08-16T10:00:00.000Z');
      const { durationDays, durationHours, durationMinutes } = calculateSynchronizedState(
        fromDate,
        toDate,
        timezone
      );

      expect(durationDays).toBe(1);
      expect(durationHours).toBe(0);
      expect(durationMinutes).toBe(0);
    });

    test('should correctly calculate a complex duration of 2 days, 5 hours and 15 minutes', () => {
      const fromDate = new Date('2025-08-15T10:00:00.000Z');
      const toDate = new Date('2025-08-17T15:15:00.000Z');
      const { durationDays, durationHours, durationMinutes } = calculateSynchronizedState(
        fromDate,
        toDate,
        timezone
      );

      expect(durationDays).toBe(2);
      expect(durationHours).toBe(5);
      expect(durationMinutes).toBe(15);
    });

    test('should handle a zero duration when "From" and "To" dates are the same', () => {
      const sameDate = new Date('2025-08-15T10:00:00.000Z');
      const { durationDays, durationHours, durationMinutes } = calculateSynchronizedState(
        sameDate,
        sameDate,
        timezone
      );

      expect(durationDays).toBe(0);
      expect(durationHours).toBe(0);
      expect(durationMinutes).toBe(0);
    });

    test('should handle a negative duration by returning zero values', () => {
      const fromDate = new Date('2025-08-15T10:00:00.000Z');
      const toDate = new Date('2025-08-14T10:00:00.000Z'); // One day before
      const { durationDays, durationHours, durationMinutes } = calculateSynchronizedState(
        fromDate,
        toDate,
        timezone
      );

      expect(durationDays).toBe(0);
      expect(durationHours).toBe(0);
      expect(durationMinutes).toBe(0);
    });

    test('should handle a duration of less than a minute', () => {
      const fromDate = new Date('2025-08-15T10:00:00.000Z');
      const toDate = new Date('2025-08-15T10:00:30.000Z'); // 30 seconds later
      const { durationDays, durationHours, durationMinutes } = calculateSynchronizedState(
        fromDate,
        toDate,
        timezone
      );

      expect(durationDays).toBe(0);
      expect(durationHours).toBe(0);
      expect(durationMinutes).toBe(0);
    });

    test('should correctly extract time parts for "From" and "To" dates', () => {
      const fromDate = new Date('2025-08-15T10:30:00.000Z');
      const toDate = new Date('2025-08-15T12:45:00.000Z');
      const { fromTime, fromAmPm, toTime, toAmPm } = calculateSynchronizedState(
        fromDate,
        toDate,
        timezone
      );

      expect(fromTime).toBe('10:30');
      expect(fromAmPm).toBe('AM');
      expect(toTime).toBe('12:45');
      expect(toAmPm).toBe('PM');
    });
  });

  describe('TimeFrameContent Tests', () => {
    const MOCK_NOW = new Date('2025-08-20T12:00:00.000Z');

    beforeEach(() => {
      // Reset mocks and timers before each test
      jest.useFakeTimers();
      jest.setSystemTime(MOCK_NOW);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const mockValues: TimeFrameValues = {
      fromDate: new Date(MOCK_NOW.getTime() - DAY_MS), // 1 day before
      toDate: MOCK_NOW,
      durationDays: 1,
      durationHours: 0,
      durationMinutes: 0,
      fromTime: '12:00',
      fromAmPm: 'PM',
      toTime: '12:00',
      toAmPm: 'PM',
    };

    const mockSetValues = jest.fn();

    test('should render correctly and initialize its state from defaults', () => {
      render(<TimeFrameContent values={mockValues} setValues={mockSetValues} />);

      const expectedToDate = MOCK_NOW;
      const expectedFromDate = new Date(expectedToDate.getTime() - DAY_MS); // 1 day before

      expect(screen.getByLabelText('To Date')).toHaveValue(
        expectedToDate.toLocaleDateString('en-US')
      );
      expect(screen.getByLabelText('From Date')).toHaveValue(
        expectedFromDate.toLocaleDateString('en-US')
      );

      expect(screen.getByLabelText('Days')).toHaveValue(1);
      expect(screen.getByLabelText('Hours')).toHaveValue(0);
    });

    test('should initialize state from props if they exists', () => {
      render(<TimeFrameContent values={{ ...mockValues }} setValues={mockSetValues} />);

      expect(screen.getByLabelText('From Date')).toHaveValue(
        mockValues.fromDate.toLocaleDateString('en-US')
      );
      expect(screen.getByLabelText('To Date')).toHaveValue(
        mockValues.toDate.toLocaleDateString('en-US')
      );
      expect(screen.getByLabelText('Days')).toHaveValue(mockValues.durationDays);
      expect(screen.getByLabelText('Hours')).toHaveValue(mockValues.durationHours);
    });

    test('should update the `From` date when the duration is increased', async () => {
      const TestWrapper = () => {
        const [values, setValues] = useState<TimeFrameValues>(() => {
          const initialFromDate = new Date('2025-08-15T00:00:00.000Z');
          const initialToDate = new Date(initialFromDate.getTime() + DAY_MS);

          return calculateSynchronizedState(initialFromDate, initialToDate, timezone);
        });

        return <TimeFrameContent values={values} setValues={setValues} />;
      };

      render(<TestWrapper />);

      const daysInput = screen.getByLabelText('Days');
      const toDateInput = screen.getByLabelText('To Date');
      const fromDateInput = screen.getByLabelText('From Date');

      // Initial state check
      expect(daysInput).toHaveValue(1);
      // Use timeZone: 'UTC' to prevent off-by-one day errors in test environments
      expect(toDateInput).toHaveValue(
        new Date('2025-08-16T00:00:00.000Z').toLocaleDateString('en-US', { timeZone: 'UTC' })
      );

      // Act: Change the duration to 3 days
      fireEvent.change(daysInput, { target: { value: 3 } });

      // Assert: 'To' date is not changed
      expect(toDateInput).toHaveValue(
        new Date('2025-08-16T00:00:00.000Z').toLocaleDateString('en-US', { timeZone: 'UTC' })
      );

      // Assert: Wait for the re-render and check the new values
      await waitFor(() => {
        expect(daysInput).toHaveValue(3);
        const expectedFromDate = new Date('2025-08-13T00:00:00.000Z');
        expect(fromDateInput).toHaveValue(
          expectedFromDate.toLocaleDateString('en-US', { timeZone: 'UTC' })
        );
      });
    });

    test('should update the duration when the `To` date or `From` date is changed', async () => {
      const TestWrapper = () => {
        const [values, setValues] = useState<TimeFrameValues>(() => {
          const initialFromDate = new Date('2025-08-15T00:00:00.000Z');
          const initialToDate = new Date(initialFromDate.getTime() + DAY_MS);

          return calculateSynchronizedState(initialFromDate, initialToDate, timezone);
        });

        return <TimeFrameContent values={values} setValues={setValues} />;
      };

      render(<TestWrapper />);

      const fromDateInput = screen.getByLabelText('From Date');
      const toDateInput = screen.getByLabelText('To Date');
      const daysInput = screen.getByLabelText('Days');

      fireEvent.change(fromDateInput, { target: { value: '2025-08-12' } });
      fireEvent.change(toDateInput, { target: { value: '2025-08-15' } });

      expect(daysInput).toHaveValue(3); // Default duration is 1 day

      // Change the to date to 2 days later
      fireEvent.change(toDateInput, { target: { value: '2025-08-17' } });
      await waitFor(() => {
        expect(daysInput).toHaveValue(5);
      });

      // Change the from date to 1 day later
      fireEvent.change(fromDateInput, { target: { value: '2025-08-13' } });
      await waitFor(() => {
        expect(daysInput).toHaveValue(4);
      });
    });

    test('should display an error when "From" date exceeds "To" date and dates should not change', async () => {
      const initialFrom = '2025-08-10T12:00:00.000Z';
      const initialTo = '2025-08-12T12:00:00.000Z';

      const TestWrapper = () => {
        const [values, setValues] = useState<TimeFrameValues>(() => {
          const initialFromDate = new Date(initialFrom);
          const initialToDate = new Date(initialTo);

          return calculateSynchronizedState(initialFromDate, initialToDate, timezone);
        });

        return <TimeFrameContent values={values} setValues={setValues} />;
      };

      render(<TestWrapper />);

      const fromDateInput = screen.getByLabelText('From Date');
      const toDateInput = screen.getByLabelText('To Date');
      const daysInput = screen.getByLabelText('Days');
      const minutesInput = screen.getByLabelText('Minutes');

      // Change "From" date to be after "To" date
      fireEvent.change(fromDateInput, { target: { value: '08/15/2025' } });

      // Check that the error notification is displayed
      const errorNotification = await screen.findByText('toBeforeFromErrorMessage');
      expect(errorNotification).toBeInTheDocument();

      // Ensure the To and From dates are not changed
      expect(toDateInput).toHaveValue(new Date(initialTo).toLocaleDateString('en-US'));
      expect(fromDateInput).toHaveValue(new Date(initialFrom).toLocaleDateString('en-US'));
      expect(daysInput).toHaveValue(2);
      expect(minutesInput).toHaveValue(0);
    });

    test('To Date should jump to the current time when Now is selected', async () => {
      const initialFrom = '2025-08-10T12:00:00.000Z';
      const initialTo = '2025-08-13T12:00:00.000Z';

      const TestWrapper = () => {
        const [values, setValues] = useState<TimeFrameValues>(() => {
          const initialFromDate = new Date(initialFrom);
          const initialToDate = new Date(initialTo);

          return calculateSynchronizedState(initialFromDate, initialToDate, timezone);
        });

        return <TimeFrameContent values={values} setValues={setValues} />;
      };

      render(<TestWrapper />);
      const toDateInput = screen.getByLabelText('To Date');
      const nowRadio = screen.getByLabelText('Now');
      // Check the initial value before the click
      expect(toDateInput).toHaveValue(new Date(initialTo).toLocaleDateString('en-US'));

      // Act: Click the radio button
      fireEvent.click(nowRadio);

      await waitFor(() => {
        expect(toDateInput).toHaveValue(MOCK_NOW.toLocaleDateString('en-US'));
      });
    });
  });
});
