/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ResultsTablePageSizingSetting from '@/components/mysettings/ResultsTablePageSizeSetting';

// Mock the next-intl module to provide translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Test Run Query Results',
      description: 'Configure the number of results displayed per page.',
    };
    return translations[key] || key;
  },
}));

// Mock useResultsTablePageSize hook
const mockSetDefaultPageSize = jest.fn();
jest.mock('@/hooks/useResultsTablePageSize', () => ({
  __esModule: true,
  default: () => ({
    defaultPageSize: 20,
    setDefaultPageSize: mockSetDefaultPageSize,
  }),
}));

// Mock useFeatureFlag hook
const mockIsFeatureEnabled = jest.fn();
jest.mock('@/contexts/FeatureFlagContext', () => ({
  __esModule: true,
  useFeatureFlags: () => ({
    isFeatureEnabled: mockIsFeatureEnabled,
  }),
}));

describe('ResultsTablePageSizingSetting', () => {
  beforeEach(() => {
    mockIsFeatureEnabled.mockClear();
    mockSetDefaultPageSize.mockClear();
  });

  describe('when feature flag is enabled', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockReturnValue(true);
    });

    test('renders without crashing', () => {
      render(<ResultsTablePageSizingSetting />);

      expect(screen.getByText('Test Run Query Results')).toBeInTheDocument();
      expect(
        screen.getByText('Configure the number of results displayed per page.')
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-items-per-page-dropdown-test')).toBeInTheDocument();
    });

    test('default page size is applied', () => {
      render(<ResultsTablePageSizingSetting />);

      const dropdown = screen.getByTestId('custom-items-per-page-dropdown-test');
      expect(within(dropdown).getByText('20')).toBeInTheDocument();
    });

    test('dropdown change calls setDefaultPageSize with the selected size', () => {
      render(<ResultsTablePageSizingSetting />);

      const dropdownWrapper = screen.getByTestId('custom-items-per-page-dropdown-test');
      const dropdownButton = within(dropdownWrapper).getByRole('combobox');

      // Open the dropdown and click on '50'
      fireEvent.click(dropdownButton);
      fireEvent.click(screen.getByText('50'));

      // Assert that the mock function was called with the correct argument
      expect(mockSetDefaultPageSize).toHaveBeenCalledWith(50);
    });
  });

  describe('when feature flag is disabled', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockReturnValue(false);
    });

    test('does not render the component', () => {
      render(<ResultsTablePageSizingSetting />);

      expect(screen.queryByText('Test Run Query Results')).toBeNull();
      expect(screen.queryByText('Configure the number of results displayed per page.')).toBeNull();
      expect(screen.queryByTestId('custom-items-per-page-dropdown-test')).toBeNull();
    });
  });
});
