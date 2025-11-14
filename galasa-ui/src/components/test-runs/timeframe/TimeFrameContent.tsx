/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import styles from '@/styles/test-runs/timeframe/TimeFrameContent.module.css';
import { TimeFrameValues } from '@/utils/interfaces';
import { useState, useCallback, useEffect } from 'react';
import TimeFrameFilter from './TimeFrameFilter';
import { dateTimeLocal2UTC, dateTimeUTC2Local } from '@/utils/timeOperations';
import { InlineNotification } from '@carbon/react';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '@/utils/constants/common';
import { useTranslations } from 'next-intl';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import DurationFilter from './DurationFilter';
import { RadioButton, FormGroup } from '@carbon/react';

type Notification = {
  text: string;
  kind: 'error' | 'warning';
};

export enum FromSelectionOptions {
  specificFromTime = 'specificFromTime',
  duration = 'duration',
}

export enum ToSelectionOptions {
  specificToTime = 'specificToTime',
  now = 'now',
}

export enum fromToSelectionEnum {
  FromSelectionOptions,
  ToSelectionOptions,
}

/*
 * Calculates the final, fully synchronized state object from two valid dates.
 */
export const calculateSynchronizedState = (
  fromDate: Date,
  toDate: Date,
  timezone: string
): TimeFrameValues => {
  const fromUiParts = dateTimeUTC2Local(fromDate, timezone);
  const toUiParts = dateTimeUTC2Local(toDate, timezone);
  let difference = toDate.getTime() - fromDate.getTime();
  if (difference < 0) difference = 0;

  const durationDays = Math.floor(difference / DAY_MS);
  difference %= DAY_MS;
  const durationHours = Math.floor(difference / HOUR_MS);
  difference %= HOUR_MS;
  const durationMinutes = Math.floor(difference / MINUTE_MS);

  return {
    fromDate,
    fromTime: fromUiParts.time,
    fromAmPm: fromUiParts.amPm,
    toDate,
    toTime: toUiParts.time,
    toAmPm: toUiParts.amPm,
    durationDays,
    durationHours,
    durationMinutes,
  };
};

/**
 * Applies time frame rules to the given dates. The one rule not is that the 'from' date must be before the 'to' date.
 * We show a warning if the 'to' date is before the 'from' date and the query is relative to now.
 * If the  exact times are used, we set an error without adjusting the 'to' time.
 * @returns An object with the corrected dates and an optional notification object.
 */
export function applyTimeFrameRules(
  fromDate: Date,
  toDate: Date,
  isRelativeToNow: boolean | undefined,
  translations: (key: string, values?: Record<string, any>) => string
): {
  correctedFrom: Date;
  correctedTo: Date;
  notification: Notification | null;
} {
  let correctedFrom = new Date(fromDate.getTime());
  let correctedTo = new Date(toDate.getTime());
  let notification: Notification | null = null;

  /*
   If the 'from' date is after the 'to' date:
   - If the query is relative to now, show a warning without adjusting the 'to' time,
       since the user may want to save a query for the future.
   - Otherwise, set an error without adjusting the 'to' time, so the user can change it himself.
  */
  if (correctedFrom > correctedTo) {
    return {
      correctedFrom: fromDate,
      correctedTo: toDate,
      notification: {
        text: isRelativeToNow
          ? translations('toBeforeFromWarningOnly')
          : translations('toBeforeFromErrorMessage'),
        kind: isRelativeToNow ? 'warning' : 'error',
      },
    };
  }

  return { correctedFrom, correctedTo, notification };
}

interface TimeFrameContentProps {
  values: TimeFrameValues;
  setValues: React.Dispatch<React.SetStateAction<TimeFrameValues>>;
}

export default function TimeFrameContent({ values, setValues }: TimeFrameContentProps) {
  const translations = useTranslations('TimeFrame');
  const { getResolvedTimeZone } = useDateTimeFormat();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedFromOption, setSelectedFromOption] = useState<FromSelectionOptions>(
    values.isRelativeToNow ? FromSelectionOptions.duration : FromSelectionOptions.specificFromTime
  );
  const [selectedToOption, setSelectedToOption] = useState<ToSelectionOptions>(
    values.isRelativeToNow ? ToSelectionOptions.now : ToSelectionOptions.specificToTime
  );

  const handleValueChange = useCallback(
    (field: keyof TimeFrameValues, value: any) => {
      if ((field === 'fromDate' || field === 'toDate') && !value) {
        return;
      }

      setNotification(null);

      const draftValues = { ...values, [field]: value };
      const timezone = getResolvedTimeZone();

      // Combine date and time into Date objects
      let fromDate = dateTimeLocal2UTC(
        draftValues.fromDate,
        draftValues.fromTime,
        draftValues.fromAmPm,
        timezone
      );

      let toDate = dateTimeLocal2UTC(
        draftValues.toDate,
        draftValues.toTime,
        draftValues.toAmPm,
        timezone
      );

      const durationInMs =
        draftValues.durationDays * DAY_MS +
        draftValues.durationHours * HOUR_MS +
        draftValues.durationMinutes * MINUTE_MS;

      if (field.startsWith('duration')) {
        // Adjust 'from' date according to 'to' date and duration
        fromDate = new Date(toDate.getTime() - durationInMs);
      } else if (field.startsWith('to')) {
        // If the 'from' options is "duration", then change the "from" time
        if (selectedFromOption === FromSelectionOptions.duration) {
          fromDate = new Date(toDate.getTime() - durationInMs);
        }
      } else if (field.startsWith('isRelativeToNow')) {
        // If the 'now' option is selected, set the 'to' date to the current date
        toDate = new Date();
      }

      const isisRelativeToNow = field === 'isRelativeToNow' ? value : values.isRelativeToNow;
      const {
        correctedFrom,
        correctedTo,
        notification: validationNotification,
      } = applyTimeFrameRules(fromDate, toDate, isisRelativeToNow, translations);

      // Set the notification if there is one
      setNotification(validationNotification);

      // Update the state with the corrected values only if the notification is not an error
      if (validationNotification?.kind !== 'error') {
        const finalState = calculateSynchronizedState(correctedFrom, correctedTo, timezone);
        setValues((prevValues) => ({ ...prevValues, ...finalState }));
      }
    },
    [values, translations, setValues, getResolvedTimeZone, selectedFromOption]
  );

  // Update the isRelativeToNow state when the selectedToOption changes
  useEffect(() => {
    const isRelativeToNow = selectedToOption === ToSelectionOptions.now;
    setValues((prevValues) => ({ ...prevValues, isRelativeToNow }));
  }, [selectedToOption, setValues]);

  return (
    <div className={styles.timeFrameContainer}>
      <div>
        <p>{translations('selectEnvelope')}</p>
        <p>{translations('envelopeDescription')}</p>
      </div>

      <FormGroup className={styles.formGroup} legendText="" role="radiogroup">
        <div className={styles.fromContainer}>
          <h3 className={styles.heading}>{translations('from')}</h3>

          <div className={styles.optionRow}>
            <RadioButton
              labelText={
                <span
                  dangerouslySetInnerHTML={{
                    __html: translations('durationTitle').replace(
                      '{boldTo}',
                      `<strong>${translations('boldTo')}</strong>`
                    ),
                  }}
                />
              }
              value={FromSelectionOptions.duration}
              id="from-duration"
              name="from-timeframe-options"
              checked={selectedFromOption === FromSelectionOptions.duration}
              onChange={() => setSelectedFromOption(FromSelectionOptions.duration)}
            />
            <div className={styles.filterWrapper}>
              <DurationFilter
                values={values}
                handleValueChange={handleValueChange}
                disabled={selectedFromOption !== FromSelectionOptions.duration}
              />
            </div>
          </div>
          <div className={styles.optionRow}>
            <RadioButton
              labelText={translations('specificTimeTitle')}
              value={FromSelectionOptions.specificFromTime}
              id="from-specific-time"
              name="from-timeframe-options"
              checked={selectedFromOption === FromSelectionOptions.specificFromTime}
              onChange={() => setSelectedFromOption(FromSelectionOptions.specificFromTime)}
            />
            <div className={styles.filterWrapper}>
              <TimeFrameFilter
                values={values}
                handleValueChange={handleValueChange}
                fromToSelection={fromToSelectionEnum.FromSelectionOptions}
                disabled={selectedFromOption !== FromSelectionOptions.specificFromTime}
              />
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.toContainer}>
          <h3 className={styles.heading}>{translations('to')}</h3>
          <div className={styles.optionRow}>
            <RadioButton
              labelText={translations('nowTitle')}
              value={ToSelectionOptions.now}
              id="to-now"
              name="to-timeframe-options"
              checked={selectedToOption === ToSelectionOptions.now}
              onChange={() => {
                setSelectedToOption(ToSelectionOptions.now);
                handleValueChange('isRelativeToNow', true);
              }}
            />
            <p className={styles.nowDescription}>{translations('nowDescription')}</p>
          </div>
          <div className={styles.optionRow}>
            <RadioButton
              labelText={translations('specificTimeTitle')}
              value={ToSelectionOptions.specificToTime}
              id="to-specific-time"
              name="to-timeframe-options"
              checked={selectedToOption === ToSelectionOptions.specificToTime}
              onChange={() => {
                setSelectedToOption(ToSelectionOptions.specificToTime);
                handleValueChange('isRelativeToNow', false);
              }}
            />
            <div className={styles.filterWrapper}>
              <TimeFrameFilter
                values={values}
                fromToSelection={fromToSelectionEnum.ToSelectionOptions}
                handleValueChange={handleValueChange}
                disabled={selectedToOption !== ToSelectionOptions.specificToTime}
              />
            </div>
          </div>
        </div>
      </FormGroup>

      {notification && (
        <InlineNotification
          className={styles.notification}
          kind={notification.kind}
          title={
            notification.kind === 'error'
              ? translations('invalidTimeFrame')
              : translations('autoCorrection')
          }
          subtitle={notification.text}
        />
      )}
    </div>
  );
}
