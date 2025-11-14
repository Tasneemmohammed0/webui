/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';

import React, { useState, useTransition } from 'react';
import { OverflowMenu, OverflowMenuItem, Theme } from '@carbon/react';
import { setUserLocale } from '@/utils/locale';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/config';
import { useRouter } from 'next/navigation';
import { Wikis, Checkmark } from '@carbon/icons-react';
import styles from '@/styles/headers/Selector.module.css';
import { useTheme } from '@/contexts/ThemeContext';

const languages = [
  { id: 'en', text: 'English', value: 'en' },
  { id: 'de', text: 'Deutsch', value: 'de' },
];

export default function LanguageSelector() {
  const { theme } = useTheme();
  const locale = useLocale();
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages.find((lang) => lang.value === locale) || languages[0]
  );

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const translations = useTranslations('LanguageSelector');

  const handleLanguageChange = ({
    selectedItem,
  }: {
    selectedItem: { id: string; text: string; value: string };
  }) => {
    if (!selectedItem) return;
    setSelectedLanguage(selectedItem);

    startTransition(() => {
      const newLocale = selectedItem.value as Locale;
      setUserLocale(newLocale); // sets the cookie
      router.refresh(); // refreshes to apply new locale
    });
  };

  let current: 'g10' | 'g90';
  if (theme === 'light') {
    current = 'g10';
  } else if (theme === 'dark') {
    current = 'g90';
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    current = 'g90';
  } else {
    current = 'g10';
  }

  return (
    <div data-floating-menu-container>
      <Theme theme={current}>
        <OverflowMenu
          data-floating-menu-container
          className={styles.overflowMenu}
          focusTrap={true}
          align="bottom"
          flipped
          renderIcon={() => <Wikis className={styles.renderIcon} />}
          size="lg"
          iconDescription={`${translations('tooltip')}: ${selectedLanguage.text}`}
          aria-label="Filter menu"
          tooltipAlignment="center"
          tooltipPosition="bottom"
        >
          {languages.map((language) => (
            <OverflowMenuItem
              key={language.id}
              className={styles.overflowMenuItem}
              itemText={
                <div className={styles.overflowMenuItemText}>
                  <span className={styles.languageText}>{language.text}</span>
                  {selectedLanguage.id === language.id && (
                    <Checkmark size={16} className={styles.checkmark} />
                  )}
                </div>
              }
              onClick={() => handleLanguageChange({ selectedItem: language })}
            />
          ))}
        </OverflowMenu>
      </Theme>
    </div>
  );
}
