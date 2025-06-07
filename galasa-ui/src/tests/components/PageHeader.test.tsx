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


const mockRouter = {
  push: jest.fn(() => useRouter().push),
  refresh: jest.fn(() => useRouter().refresh)
};

jest.mock('next/navigation', () => ({

  useRouter: jest.fn(() => mockRouter),

}));

afterEach(() => {
  jest.clearAllMocks();
});


test('renders the header containing the header menu', () => {

  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName='Galasa Service' />
    </FeatureFlagProvider>);
  
  const headerMenu = screen.getByTestId('header-menu');
  expect(headerMenu).toBeInTheDocument();
  
});

test('does NOT render the "Test runs" link by default', () => {
  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName='Galasa Service' />
    </FeatureFlagProvider>
  );

  const testRunsLink = screen.queryByText('Test runs');
  expect(testRunsLink).not.toBeInTheDocument();
});

test('renders the "Test runs" link when the feature flag is enabled via prop', () => {
  const initialFlags = JSON.stringify({testRuns: true});

  render(
    <FeatureFlagProvider initialFlags={initialFlags}>
      <PageHeader galasaServiceName='Galasa Service' />
    </FeatureFlagProvider>
  );

   
  const testRunsLink = screen.getByText('Test runs');
  expect(testRunsLink).toBeInTheDocument();
});