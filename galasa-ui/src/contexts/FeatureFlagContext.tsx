/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import FeatureFlagCookies from '@/utils/featureFlagCookies';

const DEFAULT_FEATURE_FLAGS = {
    testRuns: false, 
    // Add other feature flags here
} as const;

type FeatureFlags = {
  [K in keyof typeof DEFAULT_FEATURE_FLAGS]: boolean;
};
type FeatureFlagKey = keyof FeatureFlags;

type FeatureFlagContextType = {
    isFeatureEnabled: (feature: FeatureFlagKey) => boolean;
    toggleFeatureFlag: (feature: FeatureFlagKey) => void;
};

type ProviderProps = {
    children: ReactNode;
    initialFlags?: string;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

export const FeatureFlagProvider = ({ children, initialFlags }: ProviderProps) => {
  // Initialize feature flags state with default values or from the initialFlags prop
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
      if (initialFlags) {
        try {
          const parsedFlags = JSON.parse(initialFlags);
          return { ...DEFAULT_FEATURE_FLAGS, ...parsedFlags };
        } catch (error) {
          console.error('Error parsing initial feature flags:', error);
          return DEFAULT_FEATURE_FLAGS;
        }
      }
      return DEFAULT_FEATURE_FLAGS;
  });


  // Save feature flags to the cookie whenever they change
  useEffect(() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1); // Set expiry for 1 year
      const expires = `expires=${date.toUTCString()}`;
      
      document.cookie = `${FeatureFlagCookies.FEATURE_FLAGS}=${JSON.stringify(featureFlags)};${expires};path=/`;
  }, [featureFlags]);

  const toggleFeatureFlag = (feature: FeatureFlagKey) => {
    setFeatureFlags(prevFlags => ({
      ...prevFlags,
      [feature]: !prevFlags[feature]
    }));
  };
    

  const isFeatureEnabled = (feature: FeatureFlagKey): boolean => {
    return featureFlags[feature] ?? false; 
  };


  return (
    <FeatureFlagContext.Provider value={{ isFeatureEnabled, toggleFeatureFlag}}>
      {children}
    </FeatureFlagContext.Provider>
  );
};