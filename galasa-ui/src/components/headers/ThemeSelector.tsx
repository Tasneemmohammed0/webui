/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';

import React, { useTransition } from 'react';
import styles from '@/styles/headers/Selector.module.css';
import { ThemeType, useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Laptop } from '@carbon/icons-react';
import { Tooltip } from '@carbon/react';
import { Theme } from '@carbon/react';

const themeOptions: { id: ThemeType; label: string; icon: React.ReactNode; tooltip: string }[] = [
  { id: 'light', label: 'Light', icon: <Sun size={20} />, tooltip: 'Switch to light mode' },
  { id: 'dark', label: 'Dark', icon: <Moon size={20} />, tooltip: 'Switch to dark mode' },
  {
    id: 'system',
    label: 'System',
    icon: <Laptop size={20} />,
    tooltip: 'Switch to system preference',
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const idx = themeOptions.findIndex((o) => o.id === theme);
  const currentTheme = themeOptions[idx] || themeOptions[0];
  const next = themeOptions[(idx + 1) % themeOptions.length];

  const cycleTheme = () => {
    startTransition(() => {
      setTheme(next.id as ThemeType);
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
    <div className={styles.themeSwitcher}>
      <Theme theme={current} className={styles.themeContainer}>
        <Tooltip label={next.tooltip} align="bottom">
          <button
            onClick={cycleTheme}
            className={styles.iconButton + (currentTheme.id === theme ? ` ${styles.active}` : '')}
            disabled={isPending}
            aria-label={currentTheme.label}
          >
            {currentTheme.icon}
          </button>
        </Tooltip>
      </Theme>
    </div>
  );
}
