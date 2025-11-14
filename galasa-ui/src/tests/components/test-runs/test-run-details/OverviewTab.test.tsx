/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import OverviewTab from '@/components/test-runs/test-run-details/OverviewTab';
import { RunMetadata } from '@/utils/interfaces';
import { getAWeekBeforeSubmittedTime } from '@/utils/timeOperations';

// Mock the Carbon Tag component to simplify assertions
jest.mock('@carbon/react', () => ({
  Tag: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="mock-tag">{children}</span>
  ),
  Link: ({
    children,
    href,
    renderIcon,
  }: {
    children: React.ReactNode;
    href: string;
    renderIcon?: React.ComponentType;
  }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

jest.mock('@/utils/timeOperations', () => ({
  getAWeekBeforeSubmittedTime: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      bundle: 'Bundle',
      testName: 'Test',
      package: 'Package',
      group: 'Group',
      submissionId: 'Submission ID',
      requestor: 'Requestor',
      submitted: 'Submitted',
      started: 'Started',
      finished: 'Finished',
      duration: 'Duration',
      tags: 'Tags',
      noTags: 'No tags were associated with this test run.',
    };
    return translations[key] || key;
  },
}));

const pushBreadCrumbMock = jest.fn();
jest.mock('@/hooks/useHistoryBreadCrumbs', () => ({
  __esModule: true,
  default: () => ({
    pushBreadCrumb: pushBreadCrumbMock,
    resetBreadCrumbs: jest.fn(),
  }),
}));

const completeMetadata: RunMetadata = {
  runId: '12345678',
  runName: 'C123456',
  bundle: 'bundle-xyz',
  testName: 'TestAlpha',
  testShortName: 'TestAlphaShort',
  group: 'GroupA',
  status: 'finished',
  result: 'Passed',
  package: 'com.example.tests',
  submissionId: 'SUB123',
  requestor: 'alice@example.com',
  submitted: '2025-06-10T09:00:00Z',
  startedAt: '2025-06-10T09:05:00Z',
  finishedAt: '2025-06-10T09:15:00Z',
  duration: '10m',
  tags: ['smoke', 'regression'],
};

const mockGetAWeekBeforeSubmittedTime = getAWeekBeforeSubmittedTime as jest.MockedFunction<
  typeof getAWeekBeforeSubmittedTime
>;

describe('OverviewTab', () => {
  it('renders all top-level InlineText entries', () => {
    render(<OverviewTab metadata={completeMetadata} />);

    // check each label/value pair
    [
      ['Bundle:', completeMetadata.bundle],
      ['Test:', completeMetadata.testName],
      ['Package:', completeMetadata.package],
      ['Group:', completeMetadata.group],
      ['Submission ID:', completeMetadata.submissionId],
      ['Requestor:', completeMetadata.requestor],
    ].forEach(([label, value]) => {
      // check the label <p>
      expect(screen.getByText(label as string, { selector: 'p' })).toBeInTheDocument();

      // check the value wherever it appears
      expect(screen.getByText(value as string)).toBeInTheDocument();
    });
  });

  it('renders the timing fields in the infoContainer', () => {
    render(<OverviewTab metadata={completeMetadata} />);

    ['Submitted:', 'Started:', 'Finished:', 'Duration:'].forEach((label) => {
      expect(screen.getByText(label as string, { selector: 'p' })).toBeInTheDocument();
    });
    expect(screen.getByText(completeMetadata.duration)).toBeInTheDocument();
  });

  it('renders each tag when tags array is non-empty', () => {
    render(<OverviewTab metadata={completeMetadata} />);
    // header
    expect(screen.getByRole('heading', { level: 5, name: 'Tags' })).toBeInTheDocument();
    // tags
    const tagEls = screen.getAllByTestId('mock-tag');
    expect(tagEls).toHaveLength(2);
    expect(tagEls[0]).toHaveTextContent('smoke');
    expect(tagEls[1]).toHaveTextContent('regression');
  });

  it('shows fallback text when tags is empty or missing', () => {
    const noTags: RunMetadata = { ...completeMetadata, tags: [] };
    render(<OverviewTab metadata={noTags} />);
    expect(screen.getByText('No tags were associated with this test run.')).toBeInTheDocument();
  });
});

describe('OverviewTab - Time and Link Logic', () => {
  beforeEach(() => {
    mockGetAWeekBeforeSubmittedTime.mockReset();
  });

  it('renders recent runs link with correct href', async () => {
    mockGetAWeekBeforeSubmittedTime.mockReturnValue('2025-06-03T09:00:00Z');

    render(<OverviewTab metadata={completeMetadata} />);

    await screen.findAllByTestId('mock-link');

    const links = screen.getAllByTestId('mock-link');
    const recentRunsLink = links.find((link) => link.getAttribute('href')?.includes('testName='));

    const expectedHref = `/test-runs?testName=${completeMetadata.testName}&bundle=${completeMetadata.bundle}&package=${completeMetadata.package}&duration=60,0,0&tab=results&queryName=Recent runs of test TestAlpha`;

    expect(recentRunsLink).toHaveAttribute('href', expectedHref);
  });

  it('renders both links when weekBefore is valid', async () => {
    const mockMonthAgoDate = '2025-05-10T00:00:00Z';
    const mockWeekBefore = '2025-06-03T09:00:00Z';

    mockGetAWeekBeforeSubmittedTime.mockReturnValue(mockWeekBefore);

    render(<OverviewTab metadata={completeMetadata} />);

    await screen.findAllByTestId('mock-link');

    const links = screen.getAllByTestId('mock-link');
    expect(links).toHaveLength(2);

    // Check the retries link href
    const retriesLink = links.find((link) => link.getAttribute('href')?.includes('submissionId'));
    expect(retriesLink).toHaveAttribute(
      'href',
      `/test-runs?submissionId=${completeMetadata.submissionId}&from=${mockWeekBefore}&tab=results&queryName=All attempts of test run C123456`
    );
  });

  it('renders only recent runs link when weekBefore is invalid', async () => {
    mockGetAWeekBeforeSubmittedTime.mockReturnValue(null);

    render(<OverviewTab metadata={completeMetadata} />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const links = screen.getAllByTestId('mock-link');
    expect(links).toHaveLength(1);

    expect(links[0]).toHaveAttribute('href', expect.stringContaining('testName='));
    expect(links[0]).not.toHaveAttribute('href', expect.stringContaining('submissionId='));
  });

  it('calls getAWeekBeforeSubmittedTime with correct parameter', () => {
    const metadataWithRawSubmittedAt: RunMetadata = {
      ...completeMetadata,
      rawSubmittedAt: '2025-06-10T09:00:00Z',
    };

    mockGetAWeekBeforeSubmittedTime.mockReturnValue('2025-06-03T09:00:00Z');

    render(<OverviewTab metadata={metadataWithRawSubmittedAt} />);

    expect(mockGetAWeekBeforeSubmittedTime).toHaveBeenCalledWith('2025-06-10T09:00:00Z');
    expect(mockGetAWeekBeforeSubmittedTime).toHaveBeenCalledTimes(1);
  });

  it('handles missing rawSubmittedAt gracefully', () => {
    const metadataWithoutRawSubmittedAt: RunMetadata = {
      ...completeMetadata,
      rawSubmittedAt: undefined,
    };

    mockGetAWeekBeforeSubmittedTime.mockReturnValue('Invalid date');

    render(<OverviewTab metadata={metadataWithoutRawSubmittedAt} />);

    expect(mockGetAWeekBeforeSubmittedTime).toHaveBeenCalledWith(undefined);
  });

  it('updates weekBefore state correctly when time is valid', async () => {
    const mockWeekBefore = '2025-06-03T09:00:00Z';

    mockGetAWeekBeforeSubmittedTime.mockReturnValue(mockWeekBefore);

    render(<OverviewTab metadata={completeMetadata} />);

    await screen.findAllByTestId('mock-link');

    const links = screen.getAllByTestId('mock-link');
    const retriesLink = links.find((link) => link.getAttribute('href')?.includes('submissionId'));

    expect(retriesLink).toBeDefined();
  });

  it('updates weekBefore state correctly when time is invalid', async () => {
    mockGetAWeekBeforeSubmittedTime.mockReturnValue(null);

    render(<OverviewTab metadata={completeMetadata} />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const links = screen.getAllByTestId('mock-link');
    expect(links).toHaveLength(1);

    const retriesLink = links.find((link) => link.getAttribute('href')?.includes('submissionId'));
    expect(retriesLink).toBeUndefined();
  });

  it('push link bread crumb when any of the links is clicked', () => {
    render(<OverviewTab metadata={completeMetadata} />);

    const links = screen.getAllByTestId('mock-link');
    links.forEach((link) => {
      link.click();
      expect(pushBreadCrumbMock).toHaveBeenCalledWith({
        title: `${completeMetadata.runName}`,
        route: `/test-runs/${completeMetadata.runId}`,
      });
    });
  });
});
