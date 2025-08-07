/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FeatureFlagProvider, useFeatureFlags } from '@/contexts/FeatureFlagContext';
import FeatureFlagCookies from '@/utils/featureFlagCookies';
import { FEATURE_FLAGS } from '@/utils/featureFlags';

// Mock a simple component to display the hook's state for our tests
const TestComponent = () => {
  const { isFeatureEnabled, toggleFeatureFlag } = useFeatureFlags();

  return (
    <div>
      <p>Test Runs Enabled: {isFeatureEnabled(FEATURE_FLAGS.TEST_RUNS).toString()}</p>
      <button onClick={() => toggleFeatureFlag(FEATURE_FLAGS.TEST_RUNS)}>Toggle Test Runs</button>
    </div>
  );
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
    const initialFlags = JSON.stringify({ [FEATURE_FLAGS.TEST_RUNS]: true });
    render(
      <FeatureFlagProvider initialFlags={initialFlags}>
        <TestComponent />
      </FeatureFlagProvider>
    );

    expect(screen.getByText('Test Runs Enabled: true')).toBeInTheDocument();
  });

  test('verifies feature flag toggling and updates cookie correctly', () => {
    const initialFlags = JSON.stringify({ [FEATURE_FLAGS.TEST_RUNS]: false });
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

    const expectedCookieVal = JSON.stringify({
      [FEATURE_FLAGS.TEST_RUNS]: true,
      [FEATURE_FLAGS.INTERNATIONALIZATION]: false,
      [FEATURE_FLAGS.IS_3270_SCREEN_ENABLED]: false,
      [FEATURE_FLAGS.GRAPH]: false,
    });

    expect(cookieSpy).toHaveBeenCalledTimes(1);
    expect(cookieSpy).toHaveBeenCalledWith(
      expect.stringContaining(`${FeatureFlagCookies.FEATURE_FLAGS}=${expectedCookieVal}`)
    );
  });
});
