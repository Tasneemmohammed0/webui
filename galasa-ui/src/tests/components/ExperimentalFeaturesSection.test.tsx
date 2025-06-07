/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ExperimentalFeaturesSection from '@/components/ExperimentalFeaturesSection';
import { FeatureFlagContext } from '@/contexts/FeatureFlagContext';

describe('ExperimentalFeaturesSection', () => {

  test('Renders correctly when a "testRuns" flag disabled: Checkbox is unchecked', () => {
    // Mock a function to disable test runs feature 
    const mockIsFeatureEnabled = (key:string) => {
      if (key == 'testRuns') {
        return false;
      }
      return true;
    };

    render(
      <FeatureFlagContext.Provider value={{isFeatureEnabled: mockIsFeatureEnabled, toggleFeatureFlag: jest.fn()}}>
        <ExperimentalFeaturesSection />
      </FeatureFlagContext.Provider>
    );
  
    const checkbox = screen.getByLabelText(/Test Run/i);
    expect(checkbox).not.toBeChecked();
  });

  test('Renders correctly when a "testRuns" enabled: Checkbox is checked', () => {
    const mockIsFeatureEnabled = (key:string) => {
      return key === 'testRuns';
    };

    render(
      <FeatureFlagContext.Provider value={{isFeatureEnabled: mockIsFeatureEnabled, toggleFeatureFlag: jest.fn()}}>
        <ExperimentalFeaturesSection />
      </FeatureFlagContext.Provider>
    );
        
    const checkbox = screen.getByLabelText(/Test Run/i);
    expect(checkbox).toBeChecked();
  });

  test('Calls toggleFeatureFlag with the correct key on click', () => {
    const mockToggle = jest.fn();

    render(
      <FeatureFlagContext.Provider value={{isFeatureEnabled: () => false, toggleFeatureFlag: mockToggle}}>
        <ExperimentalFeaturesSection />
      </FeatureFlagContext.Provider>
    );

    const checkbox = screen.getByRole('checkbox', {name: /Test Run/i});
    fireEvent.click(checkbox);


    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith('testRuns');

  });
});
  