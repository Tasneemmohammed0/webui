/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { FeatureFlagProvider, useFeatureFlags } from "@/contexts/FeatureFlagContext";
import styles from "@/styles/MySettings.module.css";

export default function ExperimentalFeaturesSection() { 
  const { isFeatureEnabled, toggleFeatureFlag } = useFeatureFlags();

  // Feature configuration for easier management and display
  const featureConfig = [
    {
      key: 'testRuns' as const,
      label: 'Test Run searching and viewing',
    },
    // Add more features here when they are added to DEFAULT_FEATURE_FLAGS
  ];

  return (
    <section className={styles.experimentalFeaturesContainer}>
      <h3 className={styles.title}>Experimental Features</h3>
      <div className={styles.experimentalFeaturesHeaderContainer}>
        <p className={styles.heading}>Early access to new features. These are experimental and subject to change or removal.</p>
        <ul className={styles.featureFlagsContainer}>
          {featureConfig.map(({ key, label }) => (
            <li key={key} className={styles.featureFlag}>
              <label className={styles.featureFlagLabel}>
                <input
                  type="checkbox"
                  checked={isFeatureEnabled(key)}
                  onChange={() => toggleFeatureFlag(key)}
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>       
  );
}