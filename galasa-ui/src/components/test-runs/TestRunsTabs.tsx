/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from '@carbon/react'; 
import styles from '@/styles/TestRunsPage.module.css';
import TimeframeContent, { calculateSynchronizedState } from './TimeFrameContent';
import TestRunsTable from './TestRunsTable';
import SearchCriteriaContent from "./SearchCriteriaContent";
import TableDesignContent from './TableDesignContent';
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TestRunsData } from "@/utils/testRuns";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from 'react';
import { RESULTS_TABLE_COLUMNS, COLUMNS_IDS, TEST_RUNS_QUERY_PARAMS, DAY_MS, TABS_IDS, SEARCH_CRITERIA_KEYS, DEFAULT_VISIBLE_COLUMNS} from '@/utils/constants/common';
import { useQuery } from '@tanstack/react-query';
import { decodeStateFromUrlParam, encodeStateToUrlParam } from '@/utils/urlEncoder';
import { TimeFrameValues } from '@/utils/interfaces';
import { ColumnDefinition, runStructure } from '@/utils/interfaces';
import { sortOrderType } from '@/utils/types/common';
import { Run } from '@/generated/galasaapi';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags';
import TestRunGraph from './TestRunGraph';
import { TestStructure } from '@/generated/galasaapi';

interface TabConfig {
  id: string;
  label: string;
}

interface TestRunsTabProps {
  requestorNamesPromise: Promise<string[]>;
  resultsNamesPromise: Promise<string[]>;
}

export default function TestRunsTabs({ requestorNamesPromise, resultsNamesPromise}: TestRunsTabProps) {
  const translations = useTranslations("TestRunsTabs");
  const router = useRouter();
  const pathname = usePathname();
  const TABS_IDS = ['timeframe', 'table-design', 'search-criteria', 'results','graphs'];
  const { isFeatureEnabled } = useFeatureFlags();
  const isGraphEnabled = isFeatureEnabled(FEATURE_FLAGS.GRAPH);
  const rawSearchParams = useSearchParams();
  const { getResolvedTimeZone } = useDateTimeFormat();

  // Decode the search params from the URL every time the searchParams change
  const searchParams = useMemo(() => {
    const encodedQueryString = rawSearchParams.get('q');
    if (encodedQueryString) {
      const decodedQueryString = decodeStateFromUrlParam(encodedQueryString);
      if (decodedQueryString) {
        return new URLSearchParams(decodedQueryString);
      }
    }
    return rawSearchParams;
  }, [rawSearchParams]);

  // Initialize selectedIndex based on URL parameters or default to first tab
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const tabParam = searchParams.get("tab");
    const initialIndex = tabParam ? TABS_IDS.indexOf(tabParam) : -1;
    return initialIndex !== -1 ? initialIndex : 0;
  });

  // Initialize selectedVisibleColumns  based on URL parameters or default values
  const [selectedVisibleColumns, setSelectedVisibleColumns] = useState<string[]>(
    () => searchParams.get(TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS)?.split(',') || DEFAULT_VISIBLE_COLUMNS
  );

  // Initialize columnsOrder based on URL parameters or default to RESULTS_TABLE_COLUMNS
  const [columnsOrder, setColumnsOrder] = useState<ColumnDefinition[]>(() => {
    const orderParam = searchParams.get(TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER);
    let correctOrder: ColumnDefinition[] = RESULTS_TABLE_COLUMNS;

    // Parse the order from the URL parameter
    if (orderParam) {
      correctOrder = orderParam.split(',')
        .map(id => RESULTS_TABLE_COLUMNS.find(col => col.id === id))
        .filter(Boolean) as ColumnDefinition[];
    }

    return correctOrder;
  });

  // Initialize timeframe values based on URL parameters or default to last 24 hours
  const [timeframeValues, setTimeframeValues] = useState<TimeFrameValues>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const initialToDate = toParam ? new Date(toParam) : new Date();
    const initialFromDate = fromParam ? new Date(fromParam) : new Date(initialToDate.getTime() - DAY_MS);
    const timezone = getResolvedTimeZone();
    return calculateSynchronizedState(initialFromDate, initialToDate, timezone);
  });

  // Initialize search criteria based on URL parameters
  const [searchCriteria, setSearchCriteria] = useState<Record<string, string>>(() => {
    const criteria: Record<string, string> = {};
    SEARCH_CRITERIA_KEYS.forEach(key => {
      if (searchParams.has(key)) {
        criteria[key] = searchParams.get(key) || '';
      }
    });
    return criteria;
  });

  // Initialize sortOrder based on URL parameters or default to an empty array
  // URL should look like this sortOrder?result:asc,status:desc
  const [sortOrder, setSortOrder] = useState<{id: string; order: sortOrderType}[]>(() => {
    const sortOrderParam = searchParams.get(TEST_RUNS_QUERY_PARAMS.SORT_ORDER);
    let sortOrderArray: {id: string; order: sortOrderType}[] = [];
    if (sortOrderParam) {
      sortOrderArray = sortOrderParam.split(',').map((item) => {
        const [id, order] = item.split(':');
        return { id, order: order as sortOrderType };
      });
    }
    return sortOrderArray;
  });
    
  // State to track if the component has been initialized
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {setIsInitialized(true);}, []);

  // Define the tabs with their corresponding labels, memoized to avoid unnecessary re-renders
  const TABS_CONFIG = useMemo<TabConfig[]>(() => {
    const tabs: TabConfig[] = [
      { id: TABS_IDS[0], label: translations("tabs.timeframe") },
      { id: TABS_IDS[1], label: translations("tabs.tableDesign") },
      { id: TABS_IDS[2], label: translations("tabs.searchCriteria") },
      { id: TABS_IDS[3], label: translations("tabs.results") },
    ];

    if (isGraphEnabled) {
      tabs.push({
        id: TABS_IDS[4],
        label: translations("tabs.graph"),
      });
    }

    return tabs;
  }, [translations, isGraphEnabled]);


  // Save and encode current state to the URL. This is the single source of truth for URL updates.
  useEffect(() => {
    if (!isInitialized) return;

    // Build the query string from the current state
    const params = new URLSearchParams();

    // Tab
    params.set(TEST_RUNS_QUERY_PARAMS.TAB, TABS_CONFIG[selectedIndex].id);

    // Table Design
    if(selectedVisibleColumns.length > 0) {
      params.set(TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS, selectedVisibleColumns.join(","));
    } else {
      // If no columns are selected, we can clear the parameter
      params.delete(TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS);
    }
    if (sortOrder.length > 0) {
      params.set(TEST_RUNS_QUERY_PARAMS.SORT_ORDER, sortOrder.map(item => `${item.id}:${item.order}`).join(","));
    } else {
      params.delete(TEST_RUNS_QUERY_PARAMS.SORT_ORDER);
    }
    
    params.set(TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER, columnsOrder.map(col => col.id).join(","));

    // Timeframe
    params.set(TEST_RUNS_QUERY_PARAMS.FROM, timeframeValues.fromDate.toISOString());
    params.set(TEST_RUNS_QUERY_PARAMS.TO, timeframeValues.toDate.toISOString());

    // Search Criteria
    Object.entries(searchCriteria).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        // Remove empty criteria
        params.delete(key);
      }
    });

    // Encode the URL parameters to shorten the URL
    const encodedQuery = encodeStateToUrlParam(params.toString());
    if (encodedQuery) {
      router.replace(`${pathname}?q=${encodedQuery}`, { scroll: false });
    } else {
      // If there are no params, clear the URL.
      router.replace(pathname, { scroll: false });
    }
  }, [selectedVisibleColumns, columnsOrder, sortOrder,isInitialized, pathname, router, selectedIndex, searchParams, timeframeValues,searchCriteria, TABS_CONFIG]);


  /**
   * Transforms and flattens the raw API data for Carbon DataTable.
   * @param runs - The array of run objects from the API.
   * @returns A new array of flat objects, each with a unique `id` and properties matching the headers.
   */
  const transformRunsforTable = (runs: Run[]) : runStructure[] => {
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

  const handleTabChange = (event: {selectedIndex : number}) => {
    const currentIndex = event.selectedIndex;
    setSelectedIndex(currentIndex);
  };


  // Create a canonical query key based on the search parameters so that it won't refetch unnecessarily
  const queryKey = useMemo(() => {
    // Parameters that actually affect the data fetch
    const relevantParameters = [
      TEST_RUNS_QUERY_PARAMS.FROM, TEST_RUNS_QUERY_PARAMS.TO, TEST_RUNS_QUERY_PARAMS.RUN_NAME, TEST_RUNS_QUERY_PARAMS.REQUESTOR, TEST_RUNS_QUERY_PARAMS.GROUP,
      TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID, TEST_RUNS_QUERY_PARAMS.BUNDLE, TEST_RUNS_QUERY_PARAMS.TEST_NAME, TEST_RUNS_QUERY_PARAMS.RESULT, TEST_RUNS_QUERY_PARAMS.STATUS, TEST_RUNS_QUERY_PARAMS.TAGS
    ];

    // Create a new URLSearchParams object with the data that actually affects data fetch
    const canonicalParams: Record<string, string> = {};
    for (const key of relevantParameters) {
      if (searchParams.has(key)) {
        let value = searchParams.get(key) || '';

        // Normalize order-independent parameters
        if (key === TEST_RUNS_QUERY_PARAMS.TAGS ||
            key === TEST_RUNS_QUERY_PARAMS.RESULT || 
            key === TEST_RUNS_QUERY_PARAMS.STATUS || 
            key === TEST_RUNS_QUERY_PARAMS.REQUESTOR) {
          value = value?.split(',').sort().join(',');
        }

        canonicalParams[key] = value;
      }
    }
    
    return ['testRuns', canonicalParams];
  }, [searchParams]);


  const {data: runsData, isLoading, isError } = useQuery<TestRunsData>({
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
    enabled: ['results', 'graphs'].includes(TABS_IDS[selectedIndex]),
    // Only refetch when the canonical query key changes
    staleTime: Infinity,
  });

  // Memoized sorting logic for multi-level sorting based on column order
  const sortedRuns = useMemo(() => {
    const runsToSort = runsData?.runs ? transformRunsforTable(runsData.runs) : [];

    if (sortOrder.length !== 0 && runsToSort.length !== 0) {
      return [...runsToSort].sort((runA, runB) => {
        // Sort based on the order of columns in columnsOrder (Assumption: Leftmost has higher priority)
        for (const {id} of columnsOrder) {
          const sortConfig = sortOrder.find(order => order.id === id);

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
    <Tabs 
      className={styles.tabs}
      selectedIndex={selectedIndex}
      onChange={handleTabChange}
    >
      <TabList scrollDebounceWait={200} aria-label="Test Runs Tabs">
        {TABS_CONFIG.map((tab) => (
          <Tab key={tab.label}>{tab.label}</Tab>
        ))}
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className={styles.tabContent}>
            <TimeframeContent values={timeframeValues} setValues={setTimeframeValues}/>
          </div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
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
          </div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
            <SearchCriteriaContent
              requestorNamesPromise={requestorNamesPromise}
              resultsNamesPromise={resultsNamesPromise}
              searchCriteria={searchCriteria}
              setSearchCriteria={setSearchCriteria}
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
            <TestRunsTable
              runsList={sortedRuns ?? []}
              limitExceeded={runsData?.limitExceeded ?? false}
              visibleColumns={selectedVisibleColumns}
              orderedHeaders={columnsOrder}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
        </TabPanel>
        { isGraphEnabled &&
          <TabPanel>
            <div className={styles.tabContent}>
              <TestRunGraph
                runsList={sortedRuns ?? []}
                limitExceeded={runsData?.limitExceeded ?? false}
                visibleColumns={selectedVisibleColumns}
                isLoading={isLoading}
                isError={isError}
              />
            </div>
          </TabPanel>
        }
        
      </TabPanels>
    </Tabs>
  );
}
