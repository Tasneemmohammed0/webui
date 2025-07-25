/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { PREFERENCE_KEYS } from "@/utils/constants/common";
import { DateTimeFormats, Locale, TimeFormat } from "@/utils/types/dateTimeFormat";
import { useCallback, useState, createContext, useContext } from "react";


const LOCAL_STORAGE_KEY = 'dateTimeFormatSettings';

/**
 * DateTimeFormatContextType defines the structure of the context used for date and time formatting preferences.
 * 
 * It includes:
 * - preferences: An object containing the current date and time formatting preferences.
 * - updatePreferences: A function to update the preferences.
 * - formatDate: A function to format a given date based on the current preferences.
 */
interface DateTimeFormatContextType {
  preferences: {
    [PREFERENCE_KEYS.DATE_TIME_FORMAT_TYPE]: DateTimeFormats;
    [PREFERENCE_KEYS.LOCALE]: Locale['code'];
    [PREFERENCE_KEYS.TIME_FORMAT]: TimeFormat['label'];
  };
  updatePreferences: (newPreferences: Partial<DateTimeFormatContextType['preferences']>) => void;
  formatDate: (date: Date) => string;
}

const DateTimeFormatContext = createContext<DateTimeFormatContextType | undefined>(undefined);

/**
 * DateTimeFormatProvider component provides the context for date and time formatting preferences.
 * It manages the preferences state and provides methods to update preferences and format dates.
 * 
 * @param { children } - The child components that will have access to the DateTimeFormatContext.
 */
export function DateTimeFormatProvider({ children }: { children: React.ReactNode }) {
  const defaultPreferences: DateTimeFormatContextType['preferences'] = {
    [PREFERENCE_KEYS.DATE_TIME_FORMAT_TYPE]: 'browser' as DateTimeFormats,
    [PREFERENCE_KEYS.LOCALE]: 'en-US',
    [PREFERENCE_KEYS.TIME_FORMAT]: '12-hour'
  };

  const [preferences, setPreferences] = useState<DateTimeFormatContextType['preferences']>(() => {
    let currentPreferences: DateTimeFormatContextType['preferences'] = defaultPreferences;
    if (typeof window !== 'undefined') {
      // Load preferences from local storage or set default values
      const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedPreferences) {
        currentPreferences = JSON.parse(storedPreferences);
      }
    }
    return currentPreferences;
  });

  const updatePreferences = (newPreferences: Partial<typeof preferences>) => {
    let updatedPreferences = { ...preferences, ...newPreferences };
    if (newPreferences[PREFERENCE_KEYS.DATE_TIME_FORMAT_TYPE] === 'browser') {
      updatedPreferences = {
        ...preferences,
        ...defaultPreferences
      } as DateTimeFormatContextType['preferences'];
    } 
    setPreferences(updatedPreferences);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPreferences));
  };

  const formatDate = useCallback((date: Date): string => {
    let formattedDate: string = '-';
    try {

      if(!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error("Invalid date provided to formatDate");
      }

      const { dateTimeFormatType, locale, timeFormat } = preferences;
        
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: timeFormat === '12-hour',
      };

      if (dateTimeFormatType === 'browser') {
        // Pass undefined to use the browser's default locale
        formattedDate = new Intl.DateTimeFormat(undefined, options).format(date);
      } else {
        // Use the custom locale
        formattedDate = new Intl.DateTimeFormat(locale, options).format(date);
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }  

    return formattedDate;
  }, [preferences]);
  
  const value = { preferences, updatePreferences, formatDate };

  return (
    <DateTimeFormatContext.Provider value={value}>
      {children}
    </DateTimeFormatContext.Provider>
  );
};

/**
 * useDateTimeFormat is a custom hook that provides access to the DateTimeFormatContext.
 * 
 * @returns {DateTimeFormatContextType} - The context value for date and time formatting preferences.
 */
export function useDateTimeFormat() {
  const context = useContext(DateTimeFormatContext);
  if (context === undefined) {
    throw new Error('useDateTimeFormat must be used within a DateTimeFormatProvider');
  }
  return context;
}