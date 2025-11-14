/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { RESULTS_TABLE_PAGE_SIZES } from '@/utils/constants/common';
import { Dropdown } from '@carbon/react';
import { useTranslations } from 'next-intl';
import styles from '@/styles/mysettings/ResultsTablePageSizingSetting.module.css';
import useResultsTablePageSize from '@/hooks/useResultsTablePageSize';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags';

export default function ResultsTablePageSizingSetting() {
  const translations = useTranslations('ResultsTablePageSizingSetting');
  const { isFeatureEnabled } = useFeatureFlags();
  const { defaultPageSize, setDefaultPageSize } = useResultsTablePageSize();

  return (
    <>
      {isFeatureEnabled(FEATURE_FLAGS.TEST_RUNS) && (
        <section className={styles.section}>
          <h3 className={styles.heading}>{translations('title')}</h3>
          <div>
            <p className={styles.title}>{translations('description')}</p>
            <div className={styles.dropdownContainer}>
              <p>{translations('defaultTestRunsLabel')}</p>
              <Dropdown
                data-testid="custom-items-per-page-dropdown-test"
                items={RESULTS_TABLE_PAGE_SIZES}
                itemToString={(item: number) => item.toString()}
                selectedItem={defaultPageSize}
                onChange={(e: { selectedItem: number }) => setDefaultPageSize(e.selectedItem)}
                size="md"
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
