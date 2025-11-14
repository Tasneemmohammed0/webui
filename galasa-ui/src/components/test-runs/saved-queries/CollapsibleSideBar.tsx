/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { useMemo, useState } from 'react';
import { HeaderMenuButton, SideNavItems, Search, Button, InlineNotification } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import styles from '@/styles/test-runs/saved-queries/CollapsibleSideBar.module.css';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import QueryItem from './QueryItem';
import { useSavedQueries } from '@/contexts/SavedQueriesContext';
import { useTestRunsQueryParams } from '@/contexts/TestRunsQueryParamsContext';
import { useTranslations } from 'next-intl';
import { NotificationType, SavedQueryType } from '@/utils/types/common';
import {
  NOTIFICATION_VISIBLE_MILLISECS,
  TABS_IDS,
  TEST_RUNS_QUERY_PARAMS,
} from '@/utils/constants/common';
import { encodeStateToUrlParam } from '@/utils/encoding/urlEncoder';
import { generateUniqueQueryName } from '@/utils/functions/savedQueries';

interface CollapsibleSideBarProps {
  handleEditQueryName: (queryName: string) => void;
}

export default function CollapsibleSideBar({ handleEditQueryName }: CollapsibleSideBarProps) {
  const translations = useTranslations('CollapsibleSidebar');
  const { queryName, searchParams, setQueryName } = useTestRunsQueryParams();
  const { savedQueries, setSavedQueries, saveQuery, isQuerySaved, defaultQuery } =
    useSavedQueries();

  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State to hold the data of the item currently being dragged for the DragOverlay
  const [activeQuery, setActiveQuery] = useState<SavedQueryType | null>(null);

  // Isolate user-sortable queries from the default query
  const sortableQueries = useMemo(
    () => savedQueries.filter((query) => query.createdAt !== defaultQuery.createdAt),
    [savedQueries, defaultQuery]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Get the dragged query item
    const { active } = event;

    // Find the full query object that is being dragged and store it in state
    const currentQuery = savedQueries.find((q) => q.createdAt === active.id);
    if (currentQuery) {
      setActiveQuery(currentQuery);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Clear the active query state to remove the overlay
    setActiveQuery(null);

    // active: the dragged item, over: the item being hovered over
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const originalPosition = sortableQueries.findIndex((q) => q.createdAt === active.id);
      const newPosition = sortableQueries.findIndex((q) => q.createdAt === over.id);

      // Ensure we're only reordering valid sortable items
      if (originalPosition === -1 || newPosition === -1) return;

      const reorderedSortableQueries = arrayMove(sortableQueries, originalPosition, newPosition);
      setSavedQueries([defaultQuery, ...reorderedSortableQueries]);
    }
  };

  const handleAddCurrentQuery = () => {
    const nameToSave = queryName.trim();
    if (!nameToSave) return;

    const currentUrlParams = new URLSearchParams(searchParams);

    // Generate a unique query name
    const finalQueryTitle = generateUniqueQueryName(nameToSave, isQuerySaved);

    // Update the URL parameters
    currentUrlParams.set(TEST_RUNS_QUERY_PARAMS.TAB, TABS_IDS[3]);
    currentUrlParams.set(TEST_RUNS_QUERY_PARAMS.QUERY_NAME, finalQueryTitle);
    const newQuery = {
      title: finalQueryTitle,
      url: encodeStateToUrlParam(currentUrlParams.toString()),
      createdAt: new Date().toISOString(),
    };

    // Save the new query to the localStorage
    saveQuery(newQuery);

    // Focus to the edit input
    handleEditQueryName(finalQueryTitle);

    // Update the query name if it has changed
    if (finalQueryTitle !== queryName) {
      setQueryName(finalQueryTitle);
    }

    setNotification({
      kind: 'success',
      title: translations('newQuerySavedTitle'),
      subtitle: translations('newQuerySavedMessage', { name: finalQueryTitle }),
    });
    setTimeout(() => setNotification(null), NOTIFICATION_VISIBLE_MILLISECS);
  };

  // Filter only the sortable queries based on the search term
  const filteredSortableQueries = useMemo(() => {
    if (searchTerm) {
      return sortableQueries.filter((query) =>
        query.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return sortableQueries;
  }, [searchTerm, sortableQueries]);

  return (
    <div className={styles.container} aria-label={translations('savedQueriesHeaderLabel')}>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        collisionDetection={closestCorners}
      >
        <HeaderMenuButton
          className={styles.headerMenuButton}
          aria-label={translations('savedQueries')}
          isCollapsible
          isActive={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
        />

        <div className={styles.sidebarWrapper}>
          <div
            className={isExpanded ? styles.sideNavExpanded : styles.sideNavCollapsed}
            aria-label={translations('savedQueriesSidebarLabel')}
          >
            <div className={styles.innerContentWrapper}>
              <p className={styles.headerTitle}>{translations('savedQueries')}</p>
              <div className={styles.toolbar}>
                <Search
                  labelText={translations('searchSavedQueries')}
                  placeholder={translations('searchSavedQueries')}
                  size="lg"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  onClear={() => setSearchTerm('')}
                />
                <Button
                  kind="ghost"
                  hasIconOnly
                  renderIcon={Add}
                  iconDescription={translations('addCurrentQuery')}
                  onClick={handleAddCurrentQuery}
                  tooltipPosition="top"
                />
              </div>

              <div className={styles.sideNavContent}>
                <div>
                  {defaultQuery && !searchTerm && (
                    <QueryItem
                      query={defaultQuery}
                      key={defaultQuery.createdAt}
                      disabled
                      isCollapsed={!isExpanded}
                      handleEditQueryName={handleEditQueryName}
                      setNotification={setNotification}
                    />
                  )}
                  <SortableContext
                    items={filteredSortableQueries.map((query) => query.createdAt)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredSortableQueries.map((query) => (
                      <QueryItem
                        query={query}
                        key={query.createdAt}
                        isCollapsed={!isExpanded}
                        handleEditQueryName={handleEditQueryName}
                        setNotification={setNotification}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DragOverlay>
          {activeQuery ? (
            <QueryItem
              query={activeQuery}
              isCollapsed={!isExpanded}
              handleEditQueryName={handleEditQueryName}
              setNotification={setNotification}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          onClose={() => setNotification(null)}
          hideCloseButton={false}
          className={styles.notification}
        />
      )}
    </div>
  );
}
