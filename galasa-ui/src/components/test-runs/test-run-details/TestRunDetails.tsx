/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import BreadCrumb from '@/components/common/BreadCrumb';
import { Tab, Tabs, TabList, TabPanels, TabPanel, Loading } from '@carbon/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '@/styles/test-runs/test-run-details/TestRun.module.css';
import {
  Dashboard,
  Code,
  CloudLogging,
  RepoArtifact,
  Share,
  CloudDownload,
  Terminal_3270,
} from '@carbon/icons-react';
import OverviewTab from './OverviewTab';
import { ArtifactIndexEntry, Run, TestMethod } from '@/generated/galasaapi';
import ErrorPage from '@/app/error/page';
import { RunMetadata } from '@/utils/interfaces';
import { getIsoTimeDifference } from '@/utils/timeOperations';
import MethodsTab, { MethodDetails } from './MethodsTab';
import { ArtifactsTab } from './ArtifactsTab';
import TabFor3270 from './3270Tab/TabFor3270';
import LogTab from './LogTab';
import TestRunSkeleton from './TestRunSkeleton';
import { useTranslations } from 'next-intl';
import StatusIndicator from '../../common/StatusIndicator';
import { Tile } from '@carbon/react';
import useHistoryBreadCrumbs from '@/hooks/useHistoryBreadCrumbs';
import { handleDownload } from '@/utils/artifacts';
import { InlineNotification } from '@carbon/react';
import { Button } from '@carbon/react';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  SINGLE_RUN_QUERY_PARAMS,
  TEST_RUN_PAGE_TABS,
  NOTIFICATION_VISIBLE_MILLISECS,
} from '@/utils/constants/common';
import { NotificationType } from '@/utils/types/common';
import { TreeNodeData } from '@/utils/functions/artifacts';

interface TestRunDetailsProps {
  runId: string;
  runDetailsPromise: Promise<Run>;
  runLogPromise: Promise<string>;
  runArtifactsPromise: Promise<ArtifactIndexEntry[]>;
}

// Type the props directly on the function's parameter
const TestRunDetails = ({
  runId,
  runDetailsPromise,
  runLogPromise,
  runArtifactsPromise,
}: TestRunDetailsProps) => {
  const translations = useTranslations('TestRunDetails');
  const { breadCrumbItems } = useHistoryBreadCrumbs();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [run, setRun] = useState<RunMetadata>();
  const [methods, setMethods] = useState<TestMethod[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactIndexEntry[]>([]);
  const [logs, setLogs] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const { formatDate } = useDateTimeFormat();

  const indexOf3270Tab = TEST_RUN_PAGE_TABS.indexOf('3270');
  const [is3270TabSelectedInURL, setIs3270TabSelectedInURL] = useState<boolean>(false);
  const [zos3270TerminalFolderExists, setZos3270TerminalFolderExists] = useState<Boolean>(false);
  const [zos3270TerminalData, setZos3270TerminalData] = useState<TreeNodeData[]>([]);

  // Get the selected tab index from the URL or default to the first tab
  const [selectedTabIndex, setSelectedTabIndex] = useState(() => {
    let tabIndex = 0;
    if (searchParams.get('tab')) {
      const tabName = searchParams.get(SINGLE_RUN_QUERY_PARAMS.TAB)!;

      // Redirect 3270 tab to overview page until it has been verified that the test has a 3270 folder structure populated with images
      if (tabName === '3270') {
        setIs3270TabSelectedInURL(true);
        tabIndex = TEST_RUN_PAGE_TABS.indexOf('overview');
      } else {
        tabIndex = TEST_RUN_PAGE_TABS.indexOf(tabName);
      }
    }
    return tabIndex;
  });

  const handleZos3270TerminalFolderCheck = (newZos3270TerminalFolderExists: boolean) => {
    setZos3270TerminalFolderExists(newZos3270TerminalFolderExists);

    // If 3270 tab has been selected in the URL, move them to the 3270 pannel from the overview page redirection
    if (is3270TabSelectedInURL && newZos3270TerminalFolderExists) {
      setSelectedTabIndex(indexOf3270Tab);
    }
  };

  const handleSetZos3270TerminalData = (newZos3270TerminalData: TreeNodeData[]) => {
    setZos3270TerminalData(newZos3270TerminalData);
  };

  const extractRunDetails = useCallback(
    (runDetails: Run) => {
      setMethods(runDetails.testStructure?.methods || []);
      // Build run metadata object
      const runMetadata: RunMetadata = {
        runId: runId,
        result: runDetails.testStructure?.result!,
        status: runDetails.testStructure?.status!,
        runName: runDetails.testStructure?.runName!,
        testShortName: runDetails.testStructure?.testShortName!,
        testName: runDetails.testStructure?.testName!,
        bundle: runDetails.testStructure?.bundle!,
        submissionId: runDetails.testStructure?.submissionId!,
        group: runDetails.testStructure?.group!,
        package:
          runDetails.testStructure?.testName?.substring(
            0,
            runDetails.testStructure?.testName.lastIndexOf('.')
          ) || 'N/A',
        requestor: runDetails.testStructure?.requestor!,
        rawSubmittedAt: runDetails.testStructure?.queued,
        submitted: runDetails.testStructure?.queued
          ? formatDate(new Date(runDetails.testStructure?.queued!))
          : '-',
        startedAt: runDetails.testStructure?.startTime
          ? formatDate(new Date(runDetails.testStructure?.startTime!))
          : '-',
        finishedAt: runDetails.testStructure?.endTime
          ? formatDate(new Date(runDetails.testStructure?.endTime))
          : '-',
        duration:
          runDetails.testStructure?.startTime && runDetails.testStructure?.endTime
            ? getIsoTimeDifference(
                runDetails.testStructure?.startTime,
                runDetails.testStructure?.endTime
              )
            : '-',
        tags: runDetails.testStructure?.tags!,
      };
      setRun(runMetadata);
    },
    [runId, formatDate]
  );

  useEffect(() => {
    // If run details are already loaded, skip fetching
    if (run) return;
    const loadRunDetails = async () => {
      setIsLoading(true);

      try {
        const runDetails = await runDetailsPromise;
        const runArtifacts = await runArtifactsPromise;
        const runLog = await runLogPromise;

        if (runDetails) {
          extractRunDetails(runDetails);
          setArtifacts(runArtifacts);
          setLogs(runLog);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadRunDetails();
  }, [run, runDetailsPromise, runArtifactsPromise, runLogPromise, extractRunDetails]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotification({
        kind: 'success',
        title: translations('copiedTitle'),
        subtitle: translations('copiedMessage'),
      });

      setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
    } catch (err) {
      console.error('Failed to copy:', err);
      setNotification({
        kind: 'error',
        title: translations('errorTitle'),
        subtitle: translations('copyFailedMessage'),
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!run) return;

    setIsDownloading(true);
    setNotification(null);

    try {
      const url = new URL(`/internal-api/test-runs/${run.runId}/zip`, window.location.origin);
      url.searchParams.append('runName', run.runName);
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server responded with status ${response.status}`);
      }

      // The server provides the correct filename in the response header
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${run.runName || 'test-run'}.zip`; // Fallback filename
      if (disposition?.includes('attachment')) {
        const filenameMatch = /filename="([^"]+)"/.exec(disposition);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      // Read the response as a Blob
      const blob = await response.blob();
      handleDownload(blob, filename);
    } catch (err) {
      setNotification({
        kind: 'error',
        title: translations('errorTitle'),
        subtitle: translations('downloadError'),
      });
      console.error('Failed to create zip file:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateUrl = (params: URLSearchParams) => {
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleTabChange = (event: { selectedIndex: number }) => {
    const newIndex = event.selectedIndex;
    setSelectedTabIndex(newIndex);

    const params = new URLSearchParams(searchParams.toString());
    params.set(SINGLE_RUN_QUERY_PARAMS.TAB, TEST_RUN_PAGE_TABS[newIndex]);
    // When switching away from the log tab, remove the line parameter
    if (TEST_RUN_PAGE_TABS[newIndex] !== 'runLog') {
      params.delete(SINGLE_RUN_QUERY_PARAMS.LOG_LINE);
    }
    // When switching away from the 3270 tab, remove the terminalScreen parameter
    if (TEST_RUN_PAGE_TABS[newIndex] !== '3270') {
      params.delete(SINGLE_RUN_QUERY_PARAMS.TERMINAL_SCREEN);
    }

    updateUrl(params);
  };

  // Handle method click to navigate to the log tab with the correct line number
  const handleNavigateToLog = (method: MethodDetails) => {
    const logTabIndex = TEST_RUN_PAGE_TABS.indexOf('runLog');
    setSelectedTabIndex(logTabIndex);

    const params = new URLSearchParams(searchParams.toString());
    params.set(SINGLE_RUN_QUERY_PARAMS.TAB, TEST_RUN_PAGE_TABS[logTabIndex]);
    params.set(SINGLE_RUN_QUERY_PARAMS.LOG_LINE, method.runLogStartLine.toString());
    updateUrl(params);
  };

  // Handle method click to navigate to the 3270 tab with the correct terminal screen
  const handleNavigateTo3270 = (highlightedRowId: string) => {
    setSelectedTabIndex(indexOf3270Tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set(SINGLE_RUN_QUERY_PARAMS.TAB, TEST_RUN_PAGE_TABS[indexOf3270Tab]);
    params.set(SINGLE_RUN_QUERY_PARAMS.TERMINAL_SCREEN, highlightedRowId);
    updateUrl(params);
  };

  // Read line param for LogTab from URL
  const initialLine = useMemo(() => {
    const lineParam = searchParams.get(SINGLE_RUN_QUERY_PARAMS.LOG_LINE);
    return lineParam ? parseInt(lineParam, 10) : 0;
  }, [searchParams]);

  if (isError) {
    return <ErrorPage />;
  }

  return (
    <main id="content">
      <BreadCrumb breadCrumbItems={breadCrumbItems} />
      <Tile id="tile" className={styles.toolbar}>
        {translations('title', { runName: run?.runName || 'Unknown Run Name' })}
        <div className={styles.buttonContainer}>
          <Button
            kind="ghost"
            hasIconOnly
            onClick={handleDownloadAll}
            disabled={isDownloading}
            renderIcon={isDownloading ? () => <Loading small withOverlay={false} /> : CloudDownload}
            iconDescription={
              isDownloading ? translations('downloading') : translations('downloadArtifacts')
            }
            data-testid="icon-download-all"
          />
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={Share}
            iconDescription={translations('copyMessage')}
            onClick={handleShare}
            data-testid="icon-Share"
          />
        </div>
      </Tile>
      {notification && (
        <InlineNotification
          title={notification.title}
          subtitle={notification.subtitle}
          className={styles.notification}
          kind={notification.kind}
          hideCloseButton={true}
        />
      )}
      {isLoading ? (
        <TestRunSkeleton selectedTabIndex={selectedTabIndex} />
      ) : (
        <div className={styles.testRunContainer}>
          <div className={styles.summarySection}>
            <div>
              <span className={styles.summaryStatus}>
                {translations('status')}: {run?.status}
              </span>
              <span className={styles.summaryStatus}>
                {translations('result')}: <StatusIndicator status={run?.result!} />
              </span>
            </div>
            <span className={styles.summaryStatus}>
              {translations('test')}: {run?.testShortName}
            </span>
          </div>
          <Tabs selectedIndex={selectedTabIndex} onChange={handleTabChange}>
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
              {zos3270TerminalFolderExists && (
                <Tab renderIcon={Terminal_3270} href="#">
                  3270
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel>
                <OverviewTab metadata={run!} />
              </TabPanel>
              <TabPanel>
                <MethodsTab methods={methods} onMethodClick={handleNavigateToLog} />
              </TabPanel>
              <TabPanel>
                <LogTab logs={logs} initialLine={initialLine} />
              </TabPanel>
              <TabPanel>
                <ArtifactsTab
                  artifacts={artifacts}
                  runId={runId}
                  runName={run?.runName!}
                  setZos3270TerminalFolderExists={handleZos3270TerminalFolderCheck}
                  setZos3270TerminalData={handleSetZos3270TerminalData}
                />
              </TabPanel>
              {zos3270TerminalFolderExists && (
                <TabPanel>
                  <TabFor3270
                    runId={runId}
                    zos3270TerminalData={zos3270TerminalData}
                    is3270CurrentlySelected={indexOf3270Tab === selectedTabIndex}
                    handleNavigateTo3270={handleNavigateTo3270}
                  />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </div>
      )}
    </main>
  );
};

export default TestRunDetails;
