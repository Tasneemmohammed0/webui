/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const applyThemeToDocument = (theme: ThemeType) => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = theme === 'system' ? (isDark ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-carbon-theme', effectiveTheme);
  };
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (newTheme === 'system') localStorage.removeItem('preferred-theme');
    else localStorage.setItem('preferred-theme', newTheme);
    applyThemeToDocument(newTheme);
  };

  useEffect(() => {
    const stored = localStorage.getItem('preferred-theme') as ThemeType | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme('system');
    }
    setIsLoaded(true);

    // If you're adding extra state to this hook, make sure to review the dependency array due to the warning suppression:
    // eslint-disable-next-line
  }, []);

  if (!isLoaded) return null; // Prevent flash by not rendering anything until theme is loaded

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
