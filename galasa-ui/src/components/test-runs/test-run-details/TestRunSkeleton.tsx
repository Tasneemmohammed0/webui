/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {
  SkeletonText,
  SkeletonPlaceholder,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import { Dashboard, Code, CloudLogging, RepoArtifact } from '@carbon/icons-react';
import styles from '@/styles/test-runs/test-run-details/TestRun.module.css';
import skeletonStyles from '@/styles/test-runs/test-run-details/TestRunSkeleton.module.css';
import { useTranslations } from 'next-intl';

const TestRunSkeleton = ({ selectedTabIndex }: { selectedTabIndex: number }) => {
  const translations = useTranslations('TestRunSkeleton');

  return (
    <div className={styles.testRunContainer}>
      <div className={styles.summarySection}>
        <div>
          <span className={styles.summaryStatus}>
            {translations('status')}: <SkeletonText width="80px" />
          </span>
          <span className={styles.summaryStatus}>
            {translations('result')}: <SkeletonText width="80px" />
          </span>
        </div>

        <span className={styles.summaryStatus}>
          {translations('test')}: <SkeletonText width="120px" />
        </span>
      </div>

      <Tabs selectedIndex={selectedTabIndex}>
        <TabList iconSize="lg" className={styles.tabs}>
          <Tab renderIcon={Dashboard} href="#">
            {translations('tabs.overview')}
          </Tab>
          <Tab renderIcon={Code} href="#">
            {translations('tabs.methods')}
          </Tab>
          <Tab renderIcon={CloudLogging} href="#">
            {translations('tabs.runLog')}
          </Tab>
          <Tab renderIcon={RepoArtifact} href="#">
            {translations('tabs.artifacts')}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* Overview Tab Skeleton */}
            <div className={skeletonStyles.tabContent}>
              <SkeletonText width="120px" className={skeletonStyles.headingSkeleton} />
              <SkeletonText width="120px" className={skeletonStyles.textSkeleton} />
              <SkeletonText width="120px" className={skeletonStyles.textSkeleton} />
              <SkeletonText width="120px" className={skeletonStyles.textSkeleton} />
            </div>
          </TabPanel>
          <TabPanel>
            {/* Methods Tab Skeleton */}
            <div className={skeletonStyles.tabContent}>
              <SkeletonText heading width="120px" className={skeletonStyles.headingSkeleton} />
              <SkeletonText width="150px" className={skeletonStyles.textSkeleton} />
              <SkeletonText width="20%" className={skeletonStyles.textSkeleton} />
              <SkeletonText width="20%" />
            </div>
          </TabPanel>
          <TabPanel>
            {/* Log Tab Skeleton */}
            <div className={skeletonStyles.tabContent}>
              <SkeletonText heading width="100%" className={skeletonStyles.headingSkeleton} />
              <div className={skeletonStyles.logContainer}>
                <SkeletonText
                  paragraph={true}
                  width={`${Math.random() * 40 + 60}%`}
                  className={skeletonStyles.logLine}
                />
                <SkeletonText
                  paragraph={true}
                  width={`${Math.random() * 40 + 60}%`}
                  className={skeletonStyles.logLine}
                />
                <SkeletonText
                  paragraph={true}
                  width={`${Math.random() * 40 + 60}%`}
                  className={skeletonStyles.logLine}
                />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            {/* Artifacts Tab Skeleton */}
            <div className={skeletonStyles.artifactsContent}>
              <div>
                <SkeletonText heading width="120px" className={skeletonStyles.headingSkeleton} />
                <SkeletonText width="120px" className={skeletonStyles.logLine} />
                <SkeletonText width="120px" className={skeletonStyles.logLine} />
                <SkeletonText width="120px" className={skeletonStyles.logLine} />
                <SkeletonText width="120px" className={skeletonStyles.logLine} />
              </div>
              <div className={skeletonStyles.placeholder}>
                <SkeletonPlaceholder className={skeletonStyles.placeholder} />
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default TestRunSkeleton;
