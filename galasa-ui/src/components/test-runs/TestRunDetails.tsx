/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
import BreadCrumb from '@/components/common/BreadCrumb';
import { Tab, Tabs, TabList, TabPanels, TabPanel, Loading } from '@carbon/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from "@/styles/TestRun.module.css";
import { Dashboard, Code, CloudLogging, RepoArtifact, Share, CloudDownload } from '@carbon/icons-react';
import OverviewTab from './OverviewTab';
import { ArtifactIndexEntry, Run, TestMethod } from '@/generated/galasaapi';
import ErrorPage from '@/app/error/page';
import { RunMetadata } from '@/utils/interfaces';
import { getIsoTimeDifference } from '@/utils/timeOperations';
import MethodsTab, { MethodDetails } from './MethodsTab';
import { ArtifactsTab } from './ArtifactsTab';
import LogTab from './LogTab';
import TestRunSkeleton from './TestRunSkeleton';
import { useTranslations } from 'next-intl';
import StatusIndicator from '../common/StatusIndicator';
import { Tile } from '@carbon/react';
import useHistoryBreadCrumbs from '@/hooks/useHistoryBreadCrumbs';
import { handleDownload } from '@/utils/artifacts';
import { InlineNotification } from '@carbon/react';
import { Button } from '@carbon/react';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {SINGLE_RUN_QUERY_PARAMS, TEST_RUN_PAGE_TABS} from '@/utils/constants/common';

interface TestRunDetailsProps {
  runId: string;
  runDetailsPromise: Promise<Run>;
  runLogPromise: Promise<string>;
  runArtifactsPromise: Promise<ArtifactIndexEntry[]>;
}

// Type the props directly on the function's parameter
const TestRunDetails = ({ runId, runDetailsPromise, runLogPromise, runArtifactsPromise }: TestRunDetailsProps) => {
  const translations = useTranslations("TestRunDetails");
  const {breadCrumbItems } = useHistoryBreadCrumbs();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [run, setRun] = useState<RunMetadata>();
  const [methods, setMethods] = useState<TestMethod[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactIndexEntry[]>([]);
  const [logs, setLogs] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const { formatDate } = useDateTimeFormat();

  // Get the selected tab index from the URL or default to the first tab
  const [selectedTabIndex, setSelectedTabIndex] = useState(searchParams.get('tab') ? 
    TEST_RUN_PAGE_TABS.indexOf(searchParams.get(SINGLE_RUN_QUERY_PARAMS.TAB)!) : 0);

  const extractRunDetails = useCallback((runDetails: Run) => {
    setMethods(runDetails.testStructure?.methods || []);
    // Build run metadata object
    const runMetadata: RunMetadata = {
      runId: runId,
      result: runDetails.testStructure?.result!,
      status: runDetails.testStructure?.status!,
      runName: runDetails.testStructure?.runName!,
      testName: runDetails.testStructure?.testShortName!,
      bundle: runDetails.testStructure?.bundle!,
      submissionId: runDetails.testStructure?.submissionId!,
      group: runDetails.testStructure?.group!,
      package: runDetails.testStructure?.testName?.substring(0, runDetails.testStructure?.testName.lastIndexOf('.')) || 'N/A',
      requestor: runDetails.testStructure?.requestor!,
      rawSubmittedAt: runDetails.testStructure?.queued,
      submitted: runDetails.testStructure?.queued ? formatDate(new Date(runDetails.testStructure?.queued!)) : '-',
      startedAt: runDetails.testStructure?.startTime ? formatDate(new Date(runDetails.testStructure?.startTime!)) : '-',
      finishedAt: runDetails.testStructure?.endTime ? formatDate(new Date(runDetails.testStructure?.endTime)) : '-',
      duration: (runDetails.testStructure?.startTime && runDetails.testStructure?.endTime) ? getIsoTimeDifference(runDetails.testStructure?.startTime, runDetails.testStructure?.endTime) : '-',
      tags: runDetails.testStructure?.tags!
    };

    setRun(runMetadata);
  },[runId, formatDate]);

  useEffect(() => {
    // If run details are already loaded, skip fetching
    if(run) return;
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadAll = async () => {
    if (!run) return;
    
    setIsDownloading(true);
    setNotificationError(null); 

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
      setNotificationError("downloadError");
      console.error("Failed to create zip file:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateUrl = (params: URLSearchParams) => {
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleTabChange = (event: {selectedIndex : number}) => {
    const newIndex = event.selectedIndex;
    setSelectedTabIndex(newIndex);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set(SINGLE_RUN_QUERY_PARAMS.TAB, TEST_RUN_PAGE_TABS[newIndex]);
    // When switching away from the log tab, remove the line parameter
    if (TEST_RUN_PAGE_TABS[newIndex] !== 'runLog') {
      params.delete(SINGLE_RUN_QUERY_PARAMS.LOG_LINE);
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
        {translations("title", { runName: run?.runName || "Unknown Run Name" })}
        <div className={styles.buttonContainer}>
          <Button
            kind="ghost"
            hasIconOnly
            onClick={handleDownloadAll}
            disabled={isDownloading}
            renderIcon={isDownloading ? () => <Loading small withOverlay={false} /> : CloudDownload}
            iconDescription={isDownloading ? translations('downloading') : translations('downloadArtifacts')}
            data-testid="icon-download-all"
          />
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={Share}
            iconDescription={copied ? translations("copiedmessage") : translations("copymessage")}
            onClick={handleShare}
            data-testid="icon-Share"
          />
        </div>
      </Tile>
      {notificationError && (
        <InlineNotification
          title={translations("errorTitle")}
          subtitle={translations(notificationError) || "An unexpected error occurred."}
          className={styles.notification}
          kind="error"
        />
      )}    
 
      {isLoading ? (
        <TestRunSkeleton />
      ) : (
        <div className={styles.testRunContainer}>
          <div className={styles.summarySection}>
            <div>
              <span className={styles.summaryStatus}>
                {translations("status")}: {run?.status}
              </span>
              <span className={styles.summaryStatus}>
                {translations("result")}: <StatusIndicator status={run?.result!} />
              </span>
            </div>
            <span className={styles.summaryStatus}>
              {translations("test")}: {run?.testName}
            </span>
          </div>
          <Tabs
            selectedIndex={selectedTabIndex}
            onChange={handleTabChange}
          >
            <TabList iconSize="lg" className={styles.tabs}>
              <Tab renderIcon={Dashboard} href="#">
                {translations("tabs.overview")}
              </Tab>
              <Tab renderIcon={Code} href="#">
                {translations("tabs.methods")}
              </Tab>
              <Tab renderIcon={CloudLogging} href="#">
                {translations("tabs.runLog")}
              </Tab>
              <Tab renderIcon={RepoArtifact} href="#">
                {translations("tabs.artifacts")}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <OverviewTab metadata={run!} />
              </TabPanel>
              <TabPanel>
                <MethodsTab 
                  methods={methods} 
                  onMethodClick={handleNavigateToLog}
                />
              </TabPanel>
              <TabPanel>
                <LogTab 
                  logs={logs} 
                  initialLine={initialLine}
                />
              </TabPanel>
              <TabPanel>
                <ArtifactsTab
                  artifacts={artifacts}
                  runId={runId}
                  runName={run?.runName!}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      )}
    </main>
  );
};

export default TestRunDetails;
