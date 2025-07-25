/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { DateTimeFormatProvider, useDateTimeFormat } from '@/contexts/DateTimeFormatContext';

// Mock a simple component to display the hook's state for our tests
const TestComponent = ({ date }: { date: Date }) => {
  const {preferences, formatDate, updatePreferences} = useDateTimeFormat();
  
  return (
    <div>
      <p>Preferences: {JSON.stringify(preferences)}</p>
      <p>Formatted Date: {formatDate(date)}</p>
      <button onClick={() => updatePreferences({ locale: 'de-DE' })}>
        Update Locale
      </button>
      <button onClick={() => updatePreferences({ dateTimeFormatType: 'browser' })}>
        Set to Browser
      </button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('DateTimeFormatContext', () => {
  let originalDateTimeFormat: typeof Intl.DateTimeFormat;
  let originalTZ: string | undefined;

  beforeAll(() => {
    // Store the original implementation
    originalDateTimeFormat = Intl.DateTimeFormat;
    originalTZ = process.env.TZ;
  });

  afterAll(() => {
    // Restore original timezone after all tests in this file have run
    process.env.TZ = originalTZ;
  });

  beforeEach(() => {
    process.env.TZ = 'UTC';
    localStorage.clear();
    jest.restoreAllMocks();
  });

  const mockDate = new Date('2023-10-01T12:00:00Z');
  test('initializes with default preferences', () => {
    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    expect(screen.getByText(/Preferences:/)).toHaveTextContent(JSON.stringify({
      dateTimeFormatType: 'browser',
      locale: 'en-US',
      timeFormat: '12-hour'
    }));
  });

  test('initialize preferences from localStorage', () => {
    localStorageMock.setItem('dateTimeFormatSettings', JSON.stringify({
      dateTimeFormatType: 'custom',
      locale: 'fr-FR',
      timeFormat: '24-hour'
    }));

    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    expect(screen.getByText(/Preferences:/)).toHaveTextContent(JSON.stringify({
      dateTimeFormatType: 'custom',
      locale: 'fr-FR',
      timeFormat: '24-hour'
    }));
  });

  test('updates prefernces and localStorage', () => {
    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    // Click the button that calls updatePreferences
    const button = screen.getByRole('button', { name: /Update Locale/i });
    fireEvent.click(button);

    // The new preferences are displayed in the component
    const expectedPrefs = {
      dateTimeFormatType: 'browser',
      locale: 'de-DE', // The updated value
      timeFormat: '12-hour'
    };
    expect(screen.getByText(/Preferences:/)).toHaveTextContent(JSON.stringify(expectedPrefs));

    // Check that localStorage was updated
    const storedPreferences = JSON.parse(localStorageMock.getItem('dateTimeFormatSettings') || '{}');
    expect(storedPreferences).toEqual(expectedPrefs);
  });

  test('resets preferences to default when dateTimeFormatType is set to "browser"', () => {
    const initialCustomPrefs = {
      dateTimeFormatType: 'custom',
      locale: 'ja-JP',
      timeFormat: '24-hour'
    };
    localStorage.setItem('dateTimeFormatSettings', JSON.stringify(initialCustomPrefs));

    
    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    // Check that it initialized correctly
    expect(screen.getByText(/Preferences:/)).toHaveTextContent(JSON.stringify(initialCustomPrefs));

    // Click the button that sets the type to 'browser'
    const button = screen.getByRole('button', { name: /Set to Browser/i });
    fireEvent.click(button);

    // Assert that the preferences have been reset to the default values
    const defaultPreferences = {
      dateTimeFormatType: 'browser',
      locale: 'en-US',
      timeFormat: '12-hour'
    };
    expect(screen.getByText(/Preferences:/)).toHaveTextContent(JSON.stringify(defaultPreferences));

    // Assert that localStorage is also updated to the defaults
    const storedValue = localStorage.getItem('dateTimeFormatSettings');
    expect(storedValue).toBe(JSON.stringify(defaultPreferences));
  });

  test('formatDate uses browser locale when dateTimeFormatType is "browser"', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      (locale, options) => new originalDateTimeFormat(locale === undefined ? 'en-US' : locale, options)
    );

    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    expect(screen.getByText(/Formatted Date:/)).toHaveTextContent(/10\/01\/2023, \d{1,2}:00:00 (AM|PM)/);
  });

  test('formatDate uses custom locale and time format correctly', () => {
    // Set custom preferences in localStorage
    const customPrefs = {
      dateTimeFormatType: 'custom',
      locale: 'fr-FR',
      timeFormat: '24-hour' 
    };
    localStorage.setItem('dateTimeFormatSettings', JSON.stringify(customPrefs));

    
    render(
      <DateTimeFormatProvider>
        <TestComponent date={mockDate} />
      </DateTimeFormatProvider>
    );

    expect(screen.getByText(/Formatted Date:/)).toHaveTextContent(/01\/10\/2023.*\d{2}:\d{2}:\d{2}/);
  });

  test('returns an empty text on invalid date', () => {
    const invalidDate = new Date('invalid-date-string');
    
    render(
      <DateTimeFormatProvider>
        <TestComponent date={invalidDate} />
      </DateTimeFormatProvider>
    );

    expect(screen.getByText(/Formatted Date:/)).toHaveTextContent('-');
  });
});