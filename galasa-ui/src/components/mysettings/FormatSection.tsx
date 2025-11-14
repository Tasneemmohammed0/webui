/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import styles from '@/styles/mysettings/FormatSection.module.css';
import { PREFERENCE_KEYS, SUPPORTED_LOCALES, TIME_FORMATS } from '@/utils/constants/common';
import { TimeFormat, Locale, DateTimeFormats } from '@/utils/types/dateTimeSettings';
import { Dropdown } from '@carbon/react';
import { RadioButton, RadioButtonGroup } from '@carbon/react';
import { useTranslations } from 'next-intl';

export default function FormatSection() {
  const { preferences, updatePreferences } = useDateTimeFormat();
  const translations = useTranslations('DateTimeFormatSection');

  const handleChange = (key: keyof typeof preferences, value: string) => {
    updatePreferences({ [key]: value });
  };

  const isDropdownDisabled = preferences.dateTimeFormatType !== 'custom';

  return (
    <div className={styles.container}>
      <p className={styles.title}>{translations('description')}</p>
      <RadioButtonGroup
        legendText={translations('dateTimeFormat')}
        name="date-time-format"
        orientation="vertical"
        valueSelected={preferences.dateTimeFormatType}
        onChange={(value: string) =>
          handleChange(PREFERENCE_KEYS.DATE_TIME_FORMAT_TYPE, value as DateTimeFormats)
        }
      >
        <RadioButton
          labelText={translations('showDatesInBrowserLocale')}
          value="browser"
          id="browser-date-time-format"
        />
        <RadioButton
          labelText={translations('showDatesInCustomLocale')}
          value="custom"
          id="custom-date-time-format"
        />
        <div className={styles.dropdownContainer}>
          <Dropdown
            helperText={translations('selectLocale')}
            label={translations('selectLocale')}
            id="custom-locale-dropdown"
            data-testid="custom-locale-dropdown-test"
            items={SUPPORTED_LOCALES}
            itemToString={(item: Locale) => (item ? `${item.code} ${item.format}` : '')}
            selectedItem={SUPPORTED_LOCALES.find((item) => item.code === preferences.locale)}
            onChange={(e: { selectedItem: Locale }) =>
              handleChange(
                PREFERENCE_KEYS.LOCALE,
                e.selectedItem?.code || SUPPORTED_LOCALES[0].code
              )
            }
            size="lg"
            disabled={isDropdownDisabled}
          />
          <div className={styles.timeFormatDropdown}>
            <Dropdown
              helperText={translations('selectTimeFormat')}
              label={translations('selectTimeFormat')}
              id="custom-time-format-dropdown"
              items={TIME_FORMATS}
              itemToString={(item: TimeFormat) =>
                item ? `${translations(item.label)} ${item.format}` : ''
              }
              selectedItem={TIME_FORMATS.find((item) => item.label === preferences.timeFormat)}
              onChange={(e: { selectedItem: TimeFormat }) =>
                handleChange(
                  PREFERENCE_KEYS.TIME_FORMAT,
                  e.selectedItem?.label || TIME_FORMATS[0].label
                )
              }
              size="lg"
              disabled={isDropdownDisabled}
            />
          </div>
        </div>
      </RadioButtonGroup>
    </div>
  );
}
