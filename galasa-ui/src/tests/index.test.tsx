/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import HomePage from '@/app/page';
import PageHeader from '@/components/headers/PageHeader';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { getMarkdownFilePath } from '@/utils/markdown';
import { act, render, screen } from '@testing-library/react';
import fs, { PathLike } from 'fs';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Home',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(() => Promise.resolve('en')),
  getMessages: jest.fn(() => Promise.resolve({})),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(() => Promise.resolve('Dummy markdown content')),
}));

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({})),
  });
});

test('renders Galasa header', () => {
  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName="Galasa Service" />
    </FeatureFlagProvider>
  );

  const titleElement = screen.getByText('Galasa');
  expect(titleElement).toBeInTheDocument();
});

test('renders Galasa Ecosystem homepage', async () => {
  const homePage = await act(async () => {
    const homePageComponent = await HomePage();
    return render(<FeatureFlagProvider>{homePageComponent}</FeatureFlagProvider>);
  });
  expect(homePage).toMatchSnapshot();
});

test('getMarkdownFilePath returns localized path when that file exists', () => {
  (fs.existsSync as jest.Mock) = jest.fn(
    (filepath: PathLike) => typeof filepath === 'string' && filepath.includes('home-contents.de.md')
  );

  const result = getMarkdownFilePath('de');
  expect(result).toContain('home-contents.de.md');
});

test('getMarkdownFilePath returns fallback path when localized does not exist', () => {
  (fs.existsSync as jest.Mock) = jest.fn().mockReturnValue(false);

  const result = getMarkdownFilePath('fr');
  expect(result).toContain('home-contents.md');
});
