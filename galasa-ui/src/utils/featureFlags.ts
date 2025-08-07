/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

// Centralized feature flags
export const FEATURE_FLAGS = {
  TEST_RUNS: 'testRuns',
  INTERNATIONALIZATION: 'internationalization',
  IS_3270_SCREEN_ENABLED: 'is3270ScreenEnabled',
  GRAPH: 'graph',
  // Add other feature flags here
} as const;

export const DEFAULT_FEATURE_FLAGS = {
  testRuns: false,
  internationalization: false,
  is3270ScreenEnabled: false,
  graph: false,
  // Add other feature flags here
} as const;
