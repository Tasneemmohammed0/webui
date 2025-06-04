/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import PageTile from "@/components/PageTile";
import BreadCrumb from "@/components/common/BreadCrumb";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import styles from "@/styles/TestRunsPage.module.css";


export default function TestRunsPage() {
  return (
    <FeatureFlagProvider>
      <main id="content">
        <BreadCrumb />
        <PageTile title={"Test Runs"} />
        <div className={styles.testRunsContentWrapper}>
          <p className={styles.underConstruction}>
            This page is under construction. Please come back later to query a list of test runs.
          </p>
        </div>
      </main>
    </FeatureFlagProvider>
   
  );
};
