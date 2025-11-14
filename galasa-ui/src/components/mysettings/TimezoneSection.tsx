/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import styles from '@/styles/mysettings/TimezoneSection.module.css';
import { PREFERENCE_KEYS } from '@/utils/constants/common';
import { SUPPORTED_TIMEZONES } from '@/utils/constants/timezones';
import { TimeZone } from '@/utils/types/dateTimeSettings';
import { Dropdown } from '@carbon/react';
import { RadioButton, RadioButtonGroup } from '@carbon/react';
import { useTranslations } from 'next-intl';

type TimeZoneFormats = 'custom' | 'browser';

export default function TimezoneSection() {
  const { preferences, updatePreferences } = useDateTimeFormat();
  const translations = useTranslations('TimeZoneSection');

  const handleChange = (key: keyof typeof preferences, value: string) => {
    updatePreferences({ [key]: value });
  };

  const isDropdownDisabled = preferences.timeZoneType !== 'custom';

  return (
    <div className={styles.container}>
      <p className={styles.title}>{translations('description')}</p>
      <RadioButtonGroup
        legendText={translations('timeZoneFormat')}
        name="timezone-format"
        orientation="vertical"
        valueSelected={preferences.timeZoneType}
        onChange={(value: string) =>
          handleChange(PREFERENCE_KEYS.TIME_ZONE_TYPE, value as TimeZoneFormats)
        }
      >
        <RadioButton
          labelText={translations('showTimeZoneInBrowser')}
          value="browser"
          id="browser-time-zone-format"
        />
        <RadioButton
          labelText={translations('showTimeZoneInCustom')}
          value="custom"
          id="custom-time-zone-format"
        />
        <div className={styles.dropdownContainer}>
          <Dropdown
            className={styles.timezoneDropdown}
            helperText={translations('selectTimeZone')}
            label={translations('selectTimeZone')}
            id="custom-timezone-dropdown"
            data-testid="custom-timezone-dropdown-test"
            items={SUPPORTED_TIMEZONES}
            itemToString={(item: TimeZone) => (item.label ? item.label : '')}
            selectedItem={SUPPORTED_TIMEZONES.find((item) => item.iana === preferences.timeZone)}
            onChange={(e: { selectedItem: TimeZone }) =>
              handleChange(
                PREFERENCE_KEYS.TIME_ZONE,
                e.selectedItem?.iana || SUPPORTED_TIMEZONES[0].iana
              )
            }
            size="lg"
            disabled={isDropdownDisabled}
          />
        </div>
      </RadioButtonGroup>
    </div>
  );
}
