/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PageHeaderMenu from '@/components/headers/PageHeaderMenu';
import React from 'react';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags';

const fetchMock = jest.spyOn(global, 'fetch');

const mockRouter = {
  push: jest.fn(() => useRouter().push),
  refresh: jest.fn(() => useRouter().refresh),
};

jest.mock('@/utils/locale', () => ({
  setUserLocale: jest.fn(), // mock the function
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      profile: 'My Profile',
      settings: 'My Settings',
      logout: 'Log out',
    };
    return translations[key] || `Translated ${key}`;
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: any) => <>{children}</>,
}));

afterEach(() => {
  jest.clearAllMocks();
});

test('checking if the menu btn exists', () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );
  const menuBtn = screen.getByTestId('menu-btn');
  expect(menuBtn).toBeInTheDocument();
});

test('renders logout btn when menu btn is pressed', async () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  fireEvent.click(screen.getByTestId('menu-btn'));

  const logoutBtn = screen.getByTestId('logout-btn');

  expect(logoutBtn).toBeInTheDocument();
});

test('renders my profile btn when menu btn is pressed', async () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  fireEvent.click(screen.getByTestId('menu-btn'));

  const myProfileBtn = screen.getByTestId('my-profile-btn');

  expect(myProfileBtn).toBeInTheDocument();
});

test('clicking my profile btn redirects me to My Profle Page', async () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  fireEvent.click(screen.getByTestId('menu-btn'));

  const myProfileBtn = screen.getByTestId('my-profile-btn');

  expect(myProfileBtn).toBeInTheDocument();

  fireEvent.click(myProfileBtn);

  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});

test('clicking my settings btn redirects me to My Settings Page', async () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  fireEvent.click(screen.getByTestId('menu-btn'));

  const myProfileBtn = screen.getByTestId('my-settings-btn');

  expect(myProfileBtn).toBeInTheDocument();

  fireEvent.click(myProfileBtn);

  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});

test('clicking log out button calls handleDeleteCookieApiOperation, RESPONSE OK', async () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const response = new Response(null, {
    status: 204,
    statusText: 'OK',
    headers: {
      'Content-type': 'application/json',
    },
  });

  fetchMock.mockResolvedValueOnce(response);

  fireEvent.click(screen.getByTestId('menu-btn')); //expanding the menu items

  const logoutBtn = screen.getByTestId('logout-btn');

  expect(logoutBtn).toBeInTheDocument();

  fireEvent.click(logoutBtn);

  await waitFor(() => {
    expect(fetchMock).toBeCalledTimes(1);

    expect(mockRouter.refresh).toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });
});

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({})),
  });
});

test('renders Galasa Service header title when env GALASA_SERVICE_NAME is null or blank string', () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const titleElement = screen.getByText('Galasa Service');
  expect(titleElement.textContent).toBe('Galasa Service');
  expect(titleElement).toBeInTheDocument();
});

test('renders custom header when title when env GALASA_SERVICE_NAME is present', () => {
  render(
    <FeatureFlagProvider>
      <PageHeaderMenu galasaServiceName="Managers" />
    </FeatureFlagProvider>
  );

  const titleElement = screen.getByText('Managers');
  expect(titleElement.textContent).not.toBe('Galasa Service');
  expect(titleElement.textContent).toBe('Managers');
  expect(titleElement).toBeInTheDocument();
});
