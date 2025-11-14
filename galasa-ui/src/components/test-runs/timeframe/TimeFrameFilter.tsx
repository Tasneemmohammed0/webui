/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { fromToSelectionEnum } from './TimeFrameContent';
import styles from '@/styles/test-runs/timeframe/TimeFrameContent.module.css';
import { TimeFrameValues } from '@/utils/interfaces';
import DateTimePicker from './DateTimePicker';

export default function TimeFrameFilter({
  values,
  handleValueChange,
  fromToSelection,
  disabled = false,
}: {
  values: TimeFrameValues;
  handleValueChange: (field: keyof TimeFrameValues, value: any) => void;
  fromToSelection: fromToSelectionEnum;
  disabled?: boolean;
}) {
  // Determine which set of values to use based on the component's role
  const isFromSelection = fromToSelection === fromToSelectionEnum.FromSelectionOptions;

  return (
    <div
      className={styles.timeFrameFilterContainer}
      data-testid={isFromSelection ? 'from-timeframe-filter' : 'to-timeframe-filter'}
    >
      <DateTimePicker
        prefixId={isFromSelection ? 'from' : 'to'}
        date={isFromSelection ? values.fromDate : values.toDate}
        time={isFromSelection ? values.fromTime : values.toTime}
        amPm={isFromSelection ? values.fromAmPm : values.toAmPm}
        onDateChange={(date) => handleValueChange(isFromSelection ? 'fromDate' : 'toDate', date)}
        onTimeChange={(time) => handleValueChange(isFromSelection ? 'fromTime' : 'toTime', time)}
        onAmPmChange={(amPm) => handleValueChange(isFromSelection ? 'fromAmPm' : 'toAmPm', amPm)}
        disabled={disabled}
      />
    </div>
  );
}
