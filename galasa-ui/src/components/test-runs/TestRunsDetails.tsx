/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import BreadCrumb from '@/components/common/BreadCrumb';
import TestRunsTabs from '@/components/test-runs/TestRunsTabs';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import useHistoryBreadCrumbs from '@/hooks/useHistoryBreadCrumbs';
import { useTranslations } from 'next-intl';
import { NotificationType } from '@/utils/types/common';
import { Button, InlineNotification } from '@carbon/react';
import { Share } from '@carbon/icons-react';
import PageTile from '../PageTile';
import CollapsibleSideBar from './saved-queries/CollapsibleSideBar';
import { useSavedQueries } from '@/contexts/SavedQueriesContext';
import { useTestRunsQueryParams } from '@/contexts/TestRunsQueryParamsContext';
import {
  NOTIFICATION_VISIBLE_MILLISECS,
  TABS_IDS,
  TEST_RUNS_QUERY_PARAMS,
} from '@/utils/constants/common';
import { decodeStateFromUrlParam, encodeStateToUrlParam } from '@/utils/encoding/urlEncoder';
import QueryName from './QueryName';
import { generateUniqueQueryName } from '@/utils/functions/savedQueries';

interface TestRunsDetailsProps {
  requestorNamesPromise: Promise<string[]>;
  resultsNamesPromise: Promise<string[]>;
}

export default function TestRunsDetails({
  requestorNamesPromise,
  resultsNamesPromise,
}: TestRunsDetailsProps) {
  const { breadCrumbItems } = useHistoryBreadCrumbs();
  const translations = useTranslations('TestRunsDetails');

  const { saveQuery, isQuerySaved, getQueryByName, updateQuery } = useSavedQueries();
  const { queryName, setQueryName, searchParams } = useTestRunsQueryParams();

  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const activeQuery = getQueryByName(queryName);

  // Focus and select the input when editing
  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

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
      setNotification({
        kind: 'error',
        title: translations('errorTitle'),
        subtitle: translations('copyFailedMessage'),
      });
    }
  };

  const handleStartEditingName = (queryName: string) => {
    setEditedName(queryName);
    setIsEditingName(true);
  };

  const handleFinishEditing = () => {
    setIsEditingName(false);
    const newName = editedName.trim();
    const oldName = queryName;

    // Do nothing if the name is empty or unchanged.
    if (!newName || newName === oldName) {
      return;
    }

    // Prevent renaming to a name that already exists
    if (isQuerySaved(newName)) {
      setNotification({
        kind: 'error',
        title: translations('errorTitle'),
        subtitle: translations('nameExistsError', { name: newName }),
      });
      setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
      return;
    }

    // Find the original query using the old name
    const queryToRename = getQueryByName(oldName);

    // If it was a saved query, perform the rename in storage
    if (queryToRename) {
      const updatedUrlParams = new URLSearchParams(searchParams);

      // Update the URL parameters with the new query name and switch to results tab
      updatedUrlParams.set(TEST_RUNS_QUERY_PARAMS.QUERY_NAME, newName);
      updatedUrlParams.set(TEST_RUNS_QUERY_PARAMS.TAB, TABS_IDS[3]);

      updateQuery(queryToRename.createdAt, {
        ...queryToRename,
        title: newName,
        url: encodeStateToUrlParam(updatedUrlParams.toString()),
      });

      setNotification({
        kind: 'success',
        title: translations('successTitle'),
        subtitle: translations('queryUpdatedMessage'),
      });
      setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
    }

    // Update the local state to reflect the new name and save it to the URL
    setQueryName(newName);
  };

  // Save new query or update an existing one
  const handleSaveQuery = () => {
    const nameToSave = queryName.trim();

    if (!nameToSave) return;

    const currentUrlParams = new URLSearchParams(searchParams);

    // Change the tab to be the results tab when saving a query
    currentUrlParams.set(TEST_RUNS_QUERY_PARAMS.TAB, TABS_IDS[3]);
    currentUrlParams.set(TEST_RUNS_QUERY_PARAMS.QUERY_NAME, nameToSave);

    const existingQuery = getQueryByName(nameToSave);

    // If the query already exists, update it
    if (existingQuery) {
      updateQuery(existingQuery.createdAt, {
        ...existingQuery,
        url: encodeStateToUrlParam(currentUrlParams.toString()),
      });

      setNotification({
        kind: 'success',
        title: translations('successTitle'),
        subtitle: translations('queryUpdatedMessage'),
      });
      setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
      return;
    }

    // If the query doesn't exist, create a new one with a unique name
    const finalQueryTitle = generateUniqueQueryName(nameToSave, isQuerySaved);

    const newQuery = {
      title: finalQueryTitle,
      url: encodeStateToUrlParam(currentUrlParams.toString()),
      createdAt: new Date().toISOString(),
    };

    // Save the new query to the localStorage
    saveQuery(newQuery);

    setNotification({
      kind: 'success',
      title: translations('success'),
      subtitle: translations('newQuerySavedMessage', { name: finalQueryTitle }),
    });
    setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
  };

  const isSaveQueryDisabled = useMemo(() => {
    // If query doesn't exist in storage → keep enabled (it's a new query)
    if (!activeQuery) {
      return isQuerySaved(queryName.trim()) || false;
    }

    const currentUrlParams = new URLSearchParams(searchParams);

    // If the queryName in URL and activeQuery.title don't match → still loading → keep disabled
    if (currentUrlParams.get(TEST_RUNS_QUERY_PARAMS.QUERY_NAME) !== activeQuery?.title) {
      return true;
    }

    // Delete "tab" param from the current URL
    currentUrlParams.delete(TEST_RUNS_QUERY_PARAMS.TAB);

    let queryURL = activeQuery?.url ? decodeStateFromUrlParam(activeQuery.url) : '';

    if (queryURL) {
      const queryUrlParams = new URLSearchParams(queryURL);

      // Delete "tab" param from the query URL
      queryUrlParams.delete(TEST_RUNS_QUERY_PARAMS.TAB);
      queryURL = queryUrlParams.toString();
    }

    let isDisabled = false;
    // Disable if the current URL params (excluding tab) match the active query's URL
    if (
      currentUrlParams.toString() === queryURL ||
      queryURL === '' ||
      currentUrlParams.toString() === ''
    ) {
      isDisabled = true;
    }

    return isDisabled;
  }, [activeQuery, searchParams, isQuerySaved, queryName]);

  return (
    <div className={styles.testRunsPage}>
      <BreadCrumb breadCrumbItems={breadCrumbItems} />
      <PageTile translationKey="TestRun.title" className={styles.toolbar}>
        <div className={styles.toolbarActions}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={Share}
            iconDescription={translations('copyMessage')}
            onClick={handleShare}
          />
        </div>
      </PageTile>
      {notification && (
        <div className={styles.notification}>
          <InlineNotification
            title={notification.title}
            subtitle={notification.subtitle}
            kind={notification.kind}
            hideCloseButton={true}
          />
        </div>
      )}
      <div className={styles.testRunsContentWrapper}>
        <CollapsibleSideBar handleEditQueryName={handleStartEditingName} />

        <div className={styles.mainContent}>
          <div className={styles.queryNameContainer}>
            <QueryName
              inputRef={inputRef}
              isEditingName={isEditingName}
              editedName={editedName}
              setEditedName={setEditedName}
              handleFinishEditing={handleFinishEditing}
              handleStartEditingName={handleStartEditingName}
              translations={translations}
            />

            <Button
              kind="primary"
              type="button"
              onClick={handleSaveQuery}
              disabled={isSaveQueryDisabled}
            >
              {translations('saveQuery')}
            </Button>
          </div>
          <div className={styles.tabsContainer}>
            <Suspense fallback={<p>Loading...</p>}>
              <TestRunsTabs
                requestorNamesPromise={requestorNamesPromise}
                resultsNamesPromise={resultsNamesPromise}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
