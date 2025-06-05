/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type FeatureFlags = {
    [key: string]: boolean;
}

type FeatureFlagContextType = {
    isFeatureEnabled: (feature: string) => boolean;
    toggleFeatureFlag: (feature: string) => void;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

export const FeatureFlagProvider = ({ children }: {children: ReactNode}) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {

    // Check if running in a browser environment
    if(typeof window === 'undefined') {
      return {};
    }

    // Initialize from localStorage on first rende
    try {
      const storedFlags = localStorage.getItem('featureFlags');
      return storedFlags ? JSON.parse(storedFlags) : {};
    }
    catch (error) {
      console.error('Error loading feature flags from localStorage:', error);
      return {};
    }
  });

  // Save feature flags to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
    } catch (error) {
      console.error('Error saving feature flags to localStorage:', error);
    }
  }, [featureFlags]);

  const toggleFeatureFlag = (feature: string) => {
    setFeatureFlags(prevFlags => ({
      ...prevFlags,
      [feature]: !prevFlags[feature]
    }));
  };
    

  const isFeatureEnabled = (feature: string): boolean => {
    return featureFlags[feature] ?? false; 
  };


  return (
    <FeatureFlagContext.Provider value={{ isFeatureEnabled, toggleFeatureFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};