/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import styles from '@/styles/TestRunsPage.module.css';
import { TimeFrameValues } from '@/utils/interfaces';
import { useState, useCallback } from 'react';
import TimeFrameFilter from './TimeFrameFilter';
import { addMonths, combineDateTime, extractDateTimeForUI } from '@/utils/timeOperations';
import { InlineNotification } from '@carbon/react';
import { MAX_RANGE_MONTHS, DAY_MS, HOUR_MS, MINUTE_MS } from '@/utils/constants/common';
import { useTranslations } from 'next-intl';


type Notification = {
  text: string;
  kind: 'error' | 'warning';
};

/*
 * Calculates the final, fully synchronized state object from two valid dates.
 */
export const calculateSynchronizedState = (fromDate: Date, toDate: Date): TimeFrameValues => {
  const fromUiParts = extractDateTimeForUI(fromDate);
  const toUiParts = extractDateTimeForUI(toDate);
  let difference = toDate.getTime() - fromDate.getTime();
  if (difference < 0) difference = 0;

  const durationDays = Math.floor(difference / DAY_MS);
  difference %= DAY_MS;
  const durationHours = Math.floor(difference / HOUR_MS);
  difference %= HOUR_MS;
  const durationMinutes = Math.floor(difference / MINUTE_MS);

  return { fromDate, fromTime: fromUiParts.time, fromAmPm: fromUiParts.amPm, toDate, toTime: toUiParts.time, toAmPm: toUiParts.amPm, durationDays, durationHours, durationMinutes };
};

/**
 * A hybrid function that both validates and corrects a date range.
 * It auto-corrects non-critical issues (like exceeding 'now') and returns a warning.
 * It returns a hard error for critical issues (like an inverted range).
 * @returns An object with the corrected dates and an optional notification object.
 */
export function applyTimeFrameRules(fromDate: Date, toDate: Date, 
  translations: (key: string, values?: Record<string, any>) => string): { correctedFrom: Date; correctedTo: Date; notification: Notification | null } {
  let correctedFrom = new Date(fromDate.getTime());
  let correctedTo = new Date(toDate.getTime());
  let notification: Notification | null = null;
    
  if (correctedFrom > correctedTo) {
    return {
      correctedFrom: fromDate,
      correctedTo: toDate,
      notification: {
        text: translations('toBeforeFrom'),
        kind: 'error',
      }
    };
  }
    
  const maxToDate = addMonths(correctedFrom, MAX_RANGE_MONTHS);
  if (correctedTo > maxToDate) {
    correctedTo = maxToDate;
    notification = {
      text: translations('dateRangeExceeded', { maxMonths: MAX_RANGE_MONTHS }),
      kind: 'warning',
    };
  }
    
  const now = new Date();
  if (correctedTo > now) {
    correctedTo = now;
    notification = {
      text: translations('dateRangeCapped'),
      kind: 'warning',
    };
  }
    
    
  return { correctedFrom, correctedTo, notification };
}

interface TimeFrameContentProps {
  values: TimeFrameValues;
  setValues: (values: TimeFrameValues) => void;
}

export default function TimeFrameContent({ values, setValues }: TimeFrameContentProps) {
  const translations = useTranslations('TimeFrame');
  const [notification, setNotification] = useState<Notification | null>(null);

  const handleValueChange = useCallback((field: keyof TimeFrameValues, value: any) => {
    if ((field === 'fromDate' || field === 'toDate') && !value) {
      return;
    }

    setNotification(null);

    const draftValues = { ...values, [field]: value };

    // Combine date and time into Date objects
    let fromDate: Date, toDate: Date;
    if (field.startsWith('duration')) {
      fromDate = combineDateTime(draftValues.fromDate, draftValues.fromTime, draftValues.fromAmPm);
      const durationInMs = draftValues.durationDays * DAY_MS + draftValues.durationHours * HOUR_MS + draftValues.durationMinutes * MINUTE_MS;
      toDate = new Date(fromDate.getTime() + durationInMs);
    } else {
      fromDate = combineDateTime(draftValues.fromDate, draftValues.fromTime, draftValues.fromAmPm);
      toDate = combineDateTime(draftValues.toDate, draftValues.toTime, draftValues.toAmPm);
    }

    const { correctedFrom, correctedTo, notification: validationNotification } = applyTimeFrameRules(fromDate, toDate, translations);

    // Set the notification if there is one
    setNotification(validationNotification);

    // Update the state with the corrected values
    if (validationNotification?.kind !== 'error') {
      const finalState = calculateSynchronizedState(correctedFrom, correctedTo);
      setValues(finalState);
    }
  }, [values, translations, setValues]);

  return (
    <div className={styles.TimeFrameContainer}>
      <div>
        <p>{translations('selectEnvelope')}</p>
        <p>{translations('envelopeDescription')}</p>
      </div>
      <TimeFrameFilter values={values} handleValueChange={handleValueChange} />
      {notification && (
        <InlineNotification
          className={styles.notification}
          kind={notification.kind} 
          title={notification.kind === 'error' ? translations('invalidTimeFrame') : translations('autoCorrection')}
          subtitle={notification.text}
          hideCloseButton={true}
        />
      )}
    </div>
  );
}