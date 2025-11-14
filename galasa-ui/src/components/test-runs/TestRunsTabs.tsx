/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from '@carbon/react';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import TimeframeContent from './timeframe/TimeFrameContent';
import TestRunsTable from './results/TestRunsTable';
import SearchCriteriaContent from './search-criteria/SearchCriteriaContent';
import TableDesignContent from './table-design/TableDesignContent';
import { TestRunsData } from '@/utils/testRuns';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { COLUMNS_IDS, TEST_RUNS_QUERY_PARAMS, TABS_IDS } from '@/utils/constants/common';
import { useQuery } from '@tanstack/react-query';
import { Run } from '@/generated/galasaapi';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags';
import TestRunGraph from './graph/TestRunsGraph';
import { useTestRunsQueryParams } from '@/contexts/TestRunsQueryParamsContext';
import { runStructure } from '@/utils/interfaces';

interface TabConfig {
  id: string;
  label: string;
}

interface TestRunsTabProps {
  requestorNamesPromise: Promise<string[]>;
  resultsNamesPromise: Promise<string[]>;
}

export default function TestRunsTabs({
  requestorNamesPromise,
  resultsNamesPromise,
}: TestRunsTabProps) {
  const translations = useTranslations('TestRunsTabs');

  const { isFeatureEnabled } = useFeatureFlags();
  const isGraphEnabled = isFeatureEnabled(FEATURE_FLAGS.GRAPH);

  const {
    selectedTabIndex,
    setSelectedTabIndex,
    timeframeValues,
    setTimeframeValues,
    searchCriteria,
    setSearchCriteria,
    sortOrder,
    setSortOrder,
    columnsOrder,
    setColumnsOrder,
    selectedVisibleColumns,
    setSelectedVisibleColumns,
    isInitialized,
    searchParams,
  } = useTestRunsQueryParams();

  // Define the tabs with their corresponding labels, memoized to avoid unnecessary re-renders
  const TABS_CONFIG = useMemo<TabConfig[]>(() => {
    const tabs: TabConfig[] = [
      { id: TABS_IDS[0], label: translations('tabs.timeframe') },
      { id: TABS_IDS[1], label: translations('tabs.tableDesign') },
      { id: TABS_IDS[2], label: translations('tabs.searchCriteria') },
      { id: TABS_IDS[3], label: translations('tabs.results') },
    ];

    if (isGraphEnabled) {
      tabs.push({
        id: TABS_IDS[4],
        label: translations('tabs.graph'),
      });
    }

    return tabs;
  }, [translations, isGraphEnabled]);

  /**
   * Transforms and flattens the raw API data for Carbon DataTable.
   * @param runs - The array of run objects from the API.
   * @returns A new array of flat objects, each with a unique `id` and properties matching the headers.
   */
  const transformRunsforTable = (runs: Run[]): runStructure[] => {
    if (!runs) {
      return [];
    }

    return runs.map((run) => {
      const structure = run.testStructure || {};
      return {
        id: run.runId || 'N/A',
        submittedAt: structure.queued || 'N/A',
        runName: structure.runName || 'N/A',
        requestor: structure.requestor || 'N/A',
        group: structure.group || 'N/A',
        bundle: structure.bundle || 'N/A',
        package: structure.testName?.substring(0, structure.testName.lastIndexOf('.')) || 'N/A',
        testShortName: structure.testShortName || structure.testName || 'N/A',
        testName: structure.testName || 'N/A',
        tags: structure.tags ? structure.tags.join(', ') : 'N/A',
        status: structure.status || 'N/A',
        result: structure.result || 'N/A',
        submissionId: structure.submissionId || 'N/A',
      };
    });
  };

  const handleTabChange = (event: { selectedIndex: number }) => {
    const currentIndex = event.selectedIndex;
    setSelectedTabIndex(currentIndex);
  };

  // Create a canonical query key based on the search parameters so that it won't refetch unnecessarily
  const queryKey = useMemo(() => {
    // Parameters that actually affect the data fetch
    const relevantParameters = [
      TEST_RUNS_QUERY_PARAMS.FROM,
      TEST_RUNS_QUERY_PARAMS.TO,
      TEST_RUNS_QUERY_PARAMS.DURATION,
      TEST_RUNS_QUERY_PARAMS.RUN_NAME,
      TEST_RUNS_QUERY_PARAMS.REQUESTOR,
      TEST_RUNS_QUERY_PARAMS.GROUP,
      TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID,
      TEST_RUNS_QUERY_PARAMS.BUNDLE,
      TEST_RUNS_QUERY_PARAMS.TEST_NAME,
      TEST_RUNS_QUERY_PARAMS.RESULT,
      TEST_RUNS_QUERY_PARAMS.STATUS,
      TEST_RUNS_QUERY_PARAMS.TAGS,
    ];

    // Create a new URLSearchParams object with the data that actually affects data fetch
    const canonicalParams: Record<string, string> = {};
    for (const key of relevantParameters) {
      if (searchParams.has(key)) {
        let value = searchParams.get(key) || '';

        // Normalize order-independent parameters
        if (
          key === TEST_RUNS_QUERY_PARAMS.TAGS ||
          key === TEST_RUNS_QUERY_PARAMS.RESULT ||
          key === TEST_RUNS_QUERY_PARAMS.STATUS ||
          key === TEST_RUNS_QUERY_PARAMS.REQUESTOR
        ) {
          value = value?.split(',').sort().join(',');
        }

        canonicalParams[key] = value;
      }
    }

    return ['testRuns', canonicalParams];
  }, [searchParams]);

  const {
    data: runsData,
    isLoading,
    isError,
  } = useQuery<TestRunsData>({
    // Cache data based on search parameters
    queryKey: queryKey,
    queryFn: async () => {
      const response = await fetch(`/internal-api/test-runs?${searchParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch test runs');
      }

      return response.json() as Promise<TestRunsData>;
    },
    // Only run the query when the results tab is selected
    enabled: isInitialized && ['results', 'graphs'].includes(TABS_IDS[selectedTabIndex]),
    // Only refetch when the canonical query key changes
    staleTime: Infinity,
  });

  // Memoized sorting logic for multi-level sorting based on column order
  const sortedRuns = useMemo(() => {
    const runsToSort = runsData?.runs ? transformRunsforTable(runsData.runs) : [];

    if (sortOrder.length > 0 && runsToSort.length > 0) {
      return [...runsToSort].sort((runA, runB) => {
        // Sort based on the order of columns in columnsOrder (Assumption: Leftmost has higher priority)
        for (const { id } of columnsOrder) {
          const sortConfig = sortOrder.find((order) => order.id === id);

          // Skip this column if its sort is 'none' or not set.
          if (!sortConfig) {
            continue;
          }

          const valueA = runA[id] ?? '';
          const valueB = runB[id] ?? '';

          let comparison = String(valueA).localeCompare(String(valueB));

          if (id === COLUMNS_IDS.SUBMITTED_AT) {
            // Special handling for date fields to ensure correct comparison
            const dateA = new Date(valueA);
            const dateB = new Date(valueB);
            comparison = dateA.getTime() - dateB.getTime();
          }

          if (comparison !== 0) {
            return sortConfig.order === 'asc' ? comparison : -comparison;
          }
        }
        // If all compared columns are equal, maintain original order
        return 0;
      });
    }
    return runsToSort;
  }, [runsData, sortOrder, columnsOrder]);

  return (
    <Tabs className={styles.tabs} selectedIndex={selectedTabIndex} onChange={handleTabChange}>
      <TabList scrollDebounceWait={200} aria-label="Test Runs Tabs">
        {TABS_CONFIG.map((tab) => (
          <Tab key={tab.label}>{tab.label}</Tab>
        ))}
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className={styles.tabContent}>
            <TimeframeContent values={timeframeValues} setValues={setTimeframeValues} />
          </div>
        </TabPanel>
        <TabPanel>
          <TableDesignContent
            selectedRowIds={selectedVisibleColumns}
            setSelectedRowIds={setSelectedVisibleColumns}
            tableRows={columnsOrder}
            visibleColumns={selectedVisibleColumns}
            columnsOrder={columnsOrder}
            setTableRows={setColumnsOrder}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            setVisibleColumns={setSelectedVisibleColumns}
            setColumnsOrder={setColumnsOrder}
          />
        </TabPanel>
        <TabPanel>
          <SearchCriteriaContent
            requestorNamesPromise={requestorNamesPromise}
            resultsNamesPromise={resultsNamesPromise}
            searchCriteria={searchCriteria}
            setSearchCriteria={setSearchCriteria}
          />
        </TabPanel>
        <TabPanel>
          <TestRunsTable
            runsList={sortedRuns ?? []}
            limitExceeded={runsData?.limitExceeded ?? false}
            visibleColumns={selectedVisibleColumns}
            orderedHeaders={columnsOrder}
            isLoading={isLoading}
            isError={isError}
            isRelativeToNow={timeframeValues.isRelativeToNow}
            durationDays={timeframeValues.durationDays}
            durationHours={timeframeValues.durationHours}
            durationMinutes={timeframeValues.durationMinutes}
          />
        </TabPanel>
        {isGraphEnabled && (
          <TabPanel>
            <TestRunGraph
              runsList={sortedRuns ?? []}
              limitExceeded={runsData?.limitExceeded ?? false}
              visibleColumns={selectedVisibleColumns}
              isLoading={isLoading}
              isError={isError}
            />
          </TabPanel>
        )}
      </TabPanels>
    </Tabs>
  );
}
