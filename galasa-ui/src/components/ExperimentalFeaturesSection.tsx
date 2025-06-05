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

  return (
    <section className={styles.experimentalFeaturesContainer}>
      <h3 className={styles.title}>Experimental Features</h3>
      <div className={styles.experimentalFeaturesHeaderContainer}>
        <p className={styles.heading}>Early access to new features. These are experimental and subject to change or removal.</p>
        <div className={styles.featureFlagsContainer}>
          <div className={styles.featureFlag}>
            <label className={styles.featureFlagLabel}>
              <input
                type="checkbox"
                checked={isFeatureEnabled("testRuns")}
                onChange={() => toggleFeatureFlag("testRuns")}
              />
                            Test Run searching and viewing
            </label>
          </div>
          <div className={styles.featureFlag}>
            <label className={styles.featureFlagLabel}>
              <input
                type="checkbox"
                checked={isFeatureEnabled("anotherFeature")}
                onChange={() => toggleFeatureFlag("anotherFeature")}
              />
                            Another Feature
            </label>
          </div>
        </div>
      </div>
    </section>       
  );
}