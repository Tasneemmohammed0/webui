/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { TimeFrameValues } from '@/utils/interfaces';
import { FormGroup, NumberInput } from '@carbon/react';
import { useTranslations } from 'next-intl';
import styles from '@/styles/test-runs/timeframe/TimeFrameContent.module.css';

const MAX_HOURS = 23;
const MAX_MINUTES = 59;

export default function DurationFilter({
  values,
  handleValueChange,
  disabled = false,
}: {
  values: TimeFrameValues;
  handleValueChange: (field: keyof TimeFrameValues, value: any) => void;
  disabled?: boolean;
}) {
  const translations = useTranslations('DurationFilter');

  return (
    <FormGroup className={styles.durationFilterContainer}>
      <div
        className={styles.durationInputsContainer}
        key={values.toDate?.getTime() || 0}
        data-testid="duration-filter"
      >
        <NumberInput
          id="duration-days"
          label={translations('days')}
          min={0}
          value={values.durationDays}
          onChange={(
            _: React.ChangeEvent<HTMLInputElement>,
            { value }: { value: number | string }
          ) => handleValueChange('durationDays', value)}
          disabled={disabled}
          className={styles.durationInput}
        />
        <NumberInput
          id="duration-hours"
          label={translations('hours')}
          min={0}
          max={MAX_HOURS}
          value={values.durationHours}
          onChange={(
            _: React.ChangeEvent<HTMLInputElement>,
            { value }: { value: number | string }
          ) => handleValueChange('durationHours', value)}
          disabled={disabled}
          className={styles.durationInput}
        />
        <NumberInput
          id="duration-minutes"
          label={translations('minutes')}
          min={0}
          max={MAX_MINUTES}
          value={values.durationMinutes}
          onChange={(
            _: React.ChangeEvent<HTMLInputElement>,
            { value }: { value: number | string }
          ) => handleValueChange('durationMinutes', value)}
          disabled={disabled}
          className={styles.durationInput}
        />
      </div>
    </FormGroup>
  );
}
