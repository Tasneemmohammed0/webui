/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeSelector from '@/components/headers/ThemeSelector';

// Utility to render with provider
const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('ThemeSelector', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('dark'), // simulate system preference
        media: query,
        onchange: null,
        addListener: jest.fn(), // for older APIs
        removeListener: jest.fn(),
        addEventListener: jest.fn(), // for modern APIs
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  });

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-carbon-theme');
  });

  it('starts in system mode (aria-label "System", effective theme dark)', () => {
    renderWithTheme(<ThemeSelector />);
    const btn = screen.getByRole('button');
    // Mode is "System"
    expect(btn).toHaveAttribute('aria-label', 'System');
    // Effective applied theme is dark
    expect(document.documentElement).toHaveAttribute('data-carbon-theme', 'dark');
  });

  it('cycles to Light on first click', () => {
    renderWithTheme(<ThemeSelector />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-label', 'Light');
    expect(localStorage.getItem('preferred-theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-carbon-theme', 'light');
  });

  it('cycles to Dark on second click', () => {
    renderWithTheme(<ThemeSelector />);
    const btn = screen.getByRole('button');

    // 1st click → Light
    fireEvent.click(btn);
    // 2nd click → Dark
    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-label', 'Dark');
    expect(localStorage.getItem('preferred-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-carbon-theme', 'dark');
  });

  it('cycles back to System on third click', () => {
    renderWithTheme(<ThemeSelector />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-label', 'System');
    expect(localStorage.getItem('preferred-theme')).toBeNull();
    expect(document.documentElement).toHaveAttribute('data-carbon-theme', 'dark'); // OS still dark
  });
});
