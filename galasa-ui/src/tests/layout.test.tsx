/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import RootLayout from '@/app/layout';
import { act, render } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';

const mockRouter = {
  refresh: jest.fn(() => useRouter().refresh),
};

const mockGetBootstrapFunc = jest.fn().mockReturnValue(Promise.resolve('dummy bootstrap'));

const mockGetOpenApiSpecFunc = jest.fn().mockReturnValue(
  Promise.resolve({
    info: {
      version: 'my-galasa-version',
    },
  })
);

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('@/utils/locale', () => ({
  setUserLocale: jest.fn(), // mock the function
}));

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(() => Promise.resolve('en')), // ✅ mock getLocale async
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string, vars?: Record<string, any>) => {
    switch (key) {
      case 'profile':
        return 'My Profile';
      case 'settings':
        return 'My Settings';
      case 'logout':
        return 'Log out';
      case 'users':
        return 'Users';
      case 'testRuns':
        return 'Test runs';
      case 'versionText':
        return `Galasa version ${vars?.version ?? ''}`;
      case 'health':
        return 'Service health';
      default:
        return `Translated ${key}`;
    }
  }),
  useLocale: jest.fn(() => 'en'),
  NextIntlClientProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/generated/galasaapi', () => ({
  ...jest.requireActual('@/generated/galasaapi'),
  BootstrapAPIApi: jest.fn(() => ({
    getEcosystemBootstrap: mockGetBootstrapFunc,
  })),

  OpenAPIAPIApi: jest.fn(() => ({
    getOpenApiSpec: mockGetOpenApiSpecFunc,
  })),
}));

describe('Layout', () => {
  afterEach(() => {
    delete process.env.GALASA_SERVICE_NAME;
  });
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

  it('renders the web UI layout', async () => {
    const children = <>Hello, world!</>;
    const layout = await act(async () => {
      const renderedLayout = await RootLayout({ children });
      return render(renderedLayout);
    });
    expect(layout).toMatchSnapshot();
  });

  it('renders Galasa Service title when env GALASA_SERVICE_NAME is null or blank string', async () => {
    process.env.GALASA_SERVICE_NAME = '';
    const children = <>Hello, world!</>;

    await act(async () => {
      const renderedLayout = await RootLayout({ children });
      return render(renderedLayout);
    });
    const titleElement = document.querySelector('title')?.textContent;
    expect(titleElement).toBe('Galasa Service');
  });

  it('renders custom title when env GALASA_SERVICE_NAME is not present (not null or blank)', async () => {
    process.env.GALASA_SERVICE_NAME = 'Managers';
    const children = <>Hello, world!</>;
    await act(async () => {
      const renderedLayout = await RootLayout({ children });
      return render(renderedLayout);
    });

    const titleElement = document.querySelector('title')?.textContent;
    expect(titleElement).not.toBe('Galasa Service');
    expect(titleElement).toBe('Managers');
  });
});
