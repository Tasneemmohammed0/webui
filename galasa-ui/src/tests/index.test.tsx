/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import HomePage from '@/app/page';
import PageHeader from '@/components/headers/PageHeader';
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { act, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn().mockReturnValue('')
  }))
}));

const mockRouter = {
  refresh : jest.fn(() => useRouter().refresh),
};

jest.mock('next/navigation', () => ({

  useRouter: jest.fn(() => mockRouter),

}));

test('renders Galasa header', () => {
  render(
    <FeatureFlagProvider>
      <PageHeader galasaServiceName='Galasa Service'/>
    </FeatureFlagProvider>
  );

  const titleElement = screen.getByText('Galasa');
  expect(titleElement).toBeInTheDocument();
});

test('renders Galasa Ecosystem homepage', async () => {
  const homePage = await act(async () => {
    return render(
      <FeatureFlagProvider>
        <HomePage />
      </FeatureFlagProvider>);
  });
  expect(homePage).toMatchSnapshot();
});
