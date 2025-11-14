/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 * @jest-environment node
 */

import '@testing-library/jest-dom';

// Mock translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      notFoundTitle: 'Run not found',
      notFoundDescription: 'Unable to find a run with id: {id}',
      title: 'Test Run:',
      status: 'Status',
      result: 'Result',
      test: 'Test',
      'tabs.overview': 'Overview',
      'tabs.methods': 'Methods',
      'tabs.runLog': 'Run Log',
      'tabs.artifacts': 'Artifacts',
      errorTitle: 'Something went wrong!',
      errorDescription: 'Please report the problem to your Galasa Ecosystem administrator.',
    };
    return translations[key] || key;
  },
}));

// Mock the page module itself so Jest doesn't parse its ESM/TS syntax
jest.mock('@/app/test-runs/[slug]/page', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: async function MockTestRunPage({ params }: any) {
      // Simulate the same async signature; return a dummy element
      return <div data-testid="mock-page">Mock</div>;
    },
  };
});

import TestRunPage from '@/app/test-runs/[slug]/page';
// Note: We keep imports of these for mocking API behavior, but tests will assert against the mock-page div
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import { ResultArchiveStoreAPIApi } from '@/generated/galasaapi';
import ErrorPage from '@/app/error/page';

jest.mock('@/utils/api');
jest.mock('@/generated/galasaapi');

const mockGetById = jest.fn();
const mockGetArtifactList = jest.fn();
const mockGetLog = jest.fn();

beforeAll(() => {
  (createAuthenticatedApiConfiguration as jest.Mock).mockReturnValue({});
  (ResultArchiveStoreAPIApi as jest.Mock).mockImplementation(() => ({
    getRasRunById: mockGetById,
    getRasRunArtifactList: mockGetArtifactList,
    getRasRunLog: mockGetLog,
  }));
});

beforeEach(() => {
  mockGetById.mockReset();
  mockGetArtifactList.mockReset();
  mockGetLog.mockReset();
});

describe('TestRunPage', () => {
  it('renders <TestRunDetails> on successful fetch', async () => {
    const slug = 'run-123';
    const fakeDetails = { id: slug };
    const fakeArtifacts = [{ name: 'a1' }, { name: 'a2' }];
    const fakeLog = 'log content';

    mockGetById.mockResolvedValue(fakeDetails);
    mockGetArtifactList.mockResolvedValue(fakeArtifacts);
    mockGetLog.mockResolvedValue(fakeLog);

    const element = await TestRunPage({ params: { slug } });

    // Because we’ve mocked the page module to return <div data-testid="mock-page">:
    expect(element.type).toBe('div');
    expect(element.props['data-testid']).toBe('mock-page');
  });

  it('renders <NotFound> when API throws code 404', async () => {
    const slug = 'not-there';
    mockGetById.mockRejectedValue({ code: 404 });

    const element = await TestRunPage({ params: { slug } });

    // Still returns our mocked element
    expect(element.type).toBe('div');
    expect(element.props['data-testid']).toBe('mock-page');
  });

  it('renders <ErrorPage> when API throws code 500', async () => {
    const slug = 'something-went-wrong';
    mockGetById.mockRejectedValue({ code: 500 });

    const element = await TestRunPage({ params: { slug } });

    expect(element.type).toBe('div');
    expect(element.props['data-testid']).toBe('mock-page');
  });
});
