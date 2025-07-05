/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from '@carbon/react'; 
import styles from '@/styles/TestRunsPage.module.css';
import TimeframeContent from './TimeFrameContent';
import TestRunsTable from './TestRunsTable';
import SearchCriteriaContent from "./SearchCriteriaContent";
import TableDesignContent from './TableDesignContent';
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TestRunsData } from "@/utils/testRuns";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from 'react';
import { RESULTS_TABLE_COLUMNS, COLUMNS_IDS} from '@/utils/constants/common';

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
  const searchParams = useSearchParams();

  const TABS_IDS = ['timeframe', 'table-design', 'search-criteria', 'results'];

  // Initialize selectedIndex based on URL parameters or default to first tab
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const tabParam = searchParams.get("tab");
    const initialIndex = tabParam ? TABS_IDS.indexOf(tabParam) : -1;
    return initialIndex !== -1 ? initialIndex : 0;
  });

  // Initialize selectedVisibleColumns  based on URL parameters or default values
  const [selectedVisibleColumns, setSelectedVisibleColumns] = useState<string[]>(
    () => searchParams.get('visibleColumns')?.split(',') || [
      COLUMNS_IDS.SUBMITTED_AT,
      COLUMNS_IDS.TEST_RUN_NAME,
      COLUMNS_IDS.REQUESTOR,
      COLUMNS_IDS.TEST_NAME,
      COLUMNS_IDS.STATUS,
      COLUMNS_IDS.RESULT,
    ]
  );

  // Initialize columnsOrder based on URL parameters or default to RESULTS_TABLE_COLUMNS
  const [columnsOrder, setColumnsOrder] = useState<{ id: string; columnName: string }[]>(() => {
    const orderParam = searchParams.get('columnsOrder');
    let correctOrder = RESULTS_TABLE_COLUMNS;

    // Parse the order from the URL parameter
    if (orderParam) {
      correctOrder = orderParam.split(',')
        .map(id => RESULTS_TABLE_COLUMNS.find(col => col.id === id))
        .filter(Boolean) as { id: string; columnName: string }[];
    }

    return correctOrder;
  });
    
  // State to track if the component has been initialized
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {setIsInitialized(true);}, []);

  const [runsData, setRunsData] = useState<TestRunsData | null>(null);
  const [error, isError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const lastFetchedParamsRef = useRef<string | null>(null);

  // Define the tabs with their corresponding labels
  const TABS_CONFIG: TabConfig[] = [
    { id: TABS_IDS[0], label: translations('tabs.timeframe') },
    { id: TABS_IDS[1], label: translations('tabs.tableDesign') },
    { id: TABS_IDS[2], label: translations('tabs.searchCriteria') },
    { id: TABS_IDS[3], label: translations('tabs.results') },
  ];

  // Save to URL parameters (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const currentTab = TABS_CONFIG[selectedIndex];
    const visibleColumnsParam = selectedVisibleColumns.join(",");
    const columnsOrderParam = columnsOrder.map(col => col.id).join(",");
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", currentTab.id);
    params.set("visibleColumns", visibleColumnsParam);
    params.set("columnsOrder", columnsOrderParam);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedVisibleColumns, columnsOrder, isInitialized, pathname, router, selectedIndex]);

  const handleTabChange = (event: {selectedIndex : number}) => {
    const currentIndex = event.selectedIndex;
    setSelectedIndex(currentIndex);
  };

  // Fetch the runs list when results tab is selected
  useEffect(() => {
    // If params are not changed, do not fetch again
    if (selectedIndex === TABS_IDS.indexOf('results') 
    ) {
  console.log("Search params", searchParams);
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/test-runs?${searchParams.toString()}`);
          console.log("Response:", response);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch test runs');  
          }

          const data: TestRunsData = await response.json();
          setRunsData(data);
        } catch (error) {
          console.error("Error fetching test runs:", error);
        };
      }
      fetchData();
    }
  }, [selectedIndex, searchParams.toString()])

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
          <div className={styles.tabContent}><TimeframeContent /></div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
            <TableDesignContent
              selectedRowIds={selectedVisibleColumns}
              setSelectedRowIds={setSelectedVisibleColumns}
              tableRows={columnsOrder}
              setTableRows={setColumnsOrder}
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
            <SearchCriteriaContent
              requestorNamesPromise={requestorNamesPromise}
              resultsNamesPromise={resultsNamesPromise}
            />
          </div>
        </TabPanel>
        <TabPanel>
          <div className={styles.tabContent}>
           <TestRunsTable
              runsList={runsData?.runs ?? []}
              limitExceeded={runsData?.limitExceeded ?? false}
              visibleColumns={selectedVisibleColumns}
              orderedHeaders={columnsOrder}
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
