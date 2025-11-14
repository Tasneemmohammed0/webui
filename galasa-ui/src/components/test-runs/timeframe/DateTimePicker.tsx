/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import styles from '@/styles/test-runs/timeframe/TimeFrameContent.module.css';
import { LOCALE_TO_FLATPICKR_FORMAT_MAP } from '@/utils/constants/common';
import { parseAndValidateTime } from '@/utils/timeOperations';
import {
  FormGroup,
  DatePicker,
  DatePickerInput,
  TimePicker,
  TimePickerSelect,
  SelectItem,
} from '@carbon/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

interface DateTimePickerProps {
  date: Date;
  time: string;
  amPm: string;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
  onAmPmChange: (amPm: string) => void;
  disabled?: boolean;
  prefixId: string;
}

/**
 * A self-contained component for selecting a date and time.
 */
export default function DateTimePicker({
  date,
  time,
  amPm,
  onDateChange,
  onTimeChange,
  onAmPmChange,
  disabled = false,
  prefixId,
}: DateTimePickerProps) {
  const [localTime, setLocalTime] = useState(time);
  const { preferences } = useDateTimeFormat();
  const translations = useTranslations('DateTimePicker');
  const invalidTimeText = translations('invalidTimeText');

  // Sync local state if the time prop changes from the parent
  useEffect(() => {
    setLocalTime(time);
  }, [time]);

  const handleTimeBlur = () => {
    const formattedTime = parseAndValidateTime(localTime);
    if (formattedTime) {
      onTimeChange(formattedTime);
    } else {
      // Revert to last known valid time
      setLocalTime(time);
    }
  };

  const fullLocale = preferences?.locale || 'en-US';

  // Look up the required Flatpickr format
  const datePickerFormat = LOCALE_TO_FLATPICKR_FORMAT_MAP[fullLocale] || 'm/d/Y';

  // The `locale` prop in DatePicker expects a short language code (e.g., 'en', 'fr') for calendar translation.
  const languageCodeForPicker = fullLocale.split('-')[0];

  // Generate a placeholder from the Flatpickr format string.
  const placeholder = datePickerFormat
    .replace(/Y/g, 'yyyy')
    .replace(/m/g, 'mm')
    .replace(/d/g, 'dd');

  return (
    <FormGroup className={styles.TimeFrameFilterItem}>
      <DatePicker
        locale={languageCodeForPicker}
        dateFormat={datePickerFormat}
        datePickerType="single"
        value={date}
        onChange={(dates: Date[]) => onDateChange(dates?.[0] || null)}
      >
        <DatePickerInput
          id={`${prefixId}-date-picker`}
          labelText={translations('date')}
          placeholder={placeholder}
          disabled={disabled}
        />
      </DatePicker>
      <TimePicker
        id={`${prefixId}-time-picker`}
        labelText={translations('time')}
        value={localTime}
        invalid={!parseAndValidateTime(localTime)}
        invalidText={invalidTimeText}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLocalTime(event.target.value)}
        onBlur={handleTimeBlur}
        disabled={disabled}
      >
        <TimePickerSelect
          id={`${prefixId}-time-picker-ampm`}
          value={amPm}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onAmPmChange(event.target.value)
          }
        >
          <SelectItem text={translations('AM')} value="AM" />
          <SelectItem text={translations('PM')} value="PM" />
        </TimePickerSelect>
      </TimePicker>
    </FormGroup>
  );
}
