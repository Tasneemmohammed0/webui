/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FeatureFlagProvider, useFeatureFlags } from '@/contexts/FeatureFlagContext';
import FeatureFlagCookies from '@/utils/featureFlagCookies';

// Mock a simple component to display the hook's state for our tests
const TestComponent = () => {
  const {isFeatureEnabled, toggleFeatureFlag} = useFeatureFlags();

  return (<div>
    <p>Test Runs Enabled: {isFeatureEnabled("testRuns").toString()}</p>
    <button onClick={() => toggleFeatureFlag("testRuns")}>Toggle Test Runs</button>
  </div>);
};

describe('Feature Flags Provider and useFeatureFlags Hook', () => {
  let cookieSpy: jest.SpyInstance;
  beforeEach(() => {
    // Spy on the 'set' part of document.cookie
    cookieSpy = jest.spyOn(document, 'cookie', 'set').mockImplementation(() => {});
  });

  afterEach(() => {
    // After each test, restore the original implementation
    cookieSpy.mockRestore();
  });

  test('initializes with default feature flags when no prop is provided', () => {
    render(
      <FeatureFlagProvider>
        <TestComponent />
      </FeatureFlagProvider>
    );
    expect(screen.getByText('Test Runs Enabled: false')).toBeInTheDocument();
  });

  test('initializes with provided props from the server', () => {
    const initialFlags = JSON.stringify({ testRuns: true});
    render(
      <FeatureFlagProvider initialFlags={initialFlags}>
        <TestComponent />
      </FeatureFlagProvider> 
    );

    expect(screen.getByText('Test Runs Enabled: true')).toBeInTheDocument();
  });

  test('verifies feature flag toggling and updates cookie correctly', () => {
    const initialFlags = JSON.stringify({ testRuns: false });
    render(
      <FeatureFlagProvider initialFlags={initialFlags}>
        <TestComponent />
      </FeatureFlagProvider>
    );

    expect(screen.getByText('Test Runs Enabled: false')).toBeInTheDocument();

    // Due to React's strict mode
    cookieSpy.mockClear();
        
    const toggleButton = screen.getByText('Toggle Test Runs');

    fireEvent.click(toggleButton);

    expect(screen.getByText('Test Runs Enabled: true')).toBeInTheDocument();

    const expectedCookieVal = JSON.stringify({testRuns: true});
    expect(cookieSpy).toHaveBeenCalledTimes(1);
    expect(cookieSpy).toHaveBeenCalledWith(expect.stringContaining(`${FeatureFlagCookies.FEATURE_FLAGS}=${expectedCookieVal}`));

  });
});