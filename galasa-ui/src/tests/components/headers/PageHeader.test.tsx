/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PageHeader from '@/components/headers/PageHeader';
import React from 'react';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { useRouter } from 'next/navigation';
import { FEATURE_FLAGS } from '@/utils/featureFlags';

const mockRouter = {
  push: jest.fn(() => useRouter().push),
  refresh: jest.fn(() => useRouter().refresh),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));
jest.mock('@/utils/locale', () => ({
  setUserLocale: jest.fn(), // mock the function
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      profile: 'My Profile',
      settings: 'My Settings',
      logout: 'Log out',
      users: 'Users',
      testRuns: 'Test runs',
    };
    return translations[key] || `Translated ${key}`;
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: any) => <>{children}</>,
}));
// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({})),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the header containing the header menu', () => {
  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const headerMenu = screen.getByTestId('header-menu');
  expect(headerMenu).toBeInTheDocument();
});

test('does NOT render the "Test runs" link by default', () => {
  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const testRunsLink = screen.queryByText('Test runs');
  expect(testRunsLink).not.toBeInTheDocument();
});

test('renders the "Test runs" link when the feature flag is enabled via prop', () => {
  const initialFlags = JSON.stringify({ [FEATURE_FLAGS.TEST_RUNS]: true });

  render(
    <FeatureFlagProvider initialFlags={initialFlags}>
      <PageHeader galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const testRunsLink = screen.getByText('Test runs');
  expect(testRunsLink).toBeInTheDocument();
});
