/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import styles from '@/styles/MySettings.module.css';
import { FEATURE_FLAGS } from '@/utils/featureFlags';
import { useTranslations } from 'next-intl';

export default function ExperimentalFeaturesSection() {
  const { isFeatureEnabled, toggleFeatureFlag } = useFeatureFlags();
  const translations = useTranslations('ExperimentalFeatures');

  // Feature configuration for easier management and display
  const featureConfig = [
    {
      key: FEATURE_FLAGS.TEST_RUNS,
      label: translations(`features.testRunSearch`),
    },
    {
      key: FEATURE_FLAGS.INTERNATIONALIZATION,
      label: translations('features.internationalization'),
    },
    {
      key: FEATURE_FLAGS.IS_3270_SCREEN_ENABLED,
      label: translations('features.is3270ScreenEnabled'),
    },
    {
      key: FEATURE_FLAGS.GRAPH,
      label: translations('features.graph'),
    },
    // Add more features here when they are added to DEFAULT_FEATURE_FLAGS
  ];

  return (
    <section className={styles.experimentalFeaturesContainer}>
      <h3 className={styles.title}>{translations('title')}</h3>
      <div className={styles.experimentalFeaturesHeaderContainer}>
        <p className={styles.heading}>{translations('description')}</p>
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
