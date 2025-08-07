/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import styles from '@/styles/TestRunsPage.module.css';
import TableDesignRow from './TableDesignRow';
import { Checkbox, Button } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { InlineNotification } from '@carbon/react';
import { ColumnDefinition } from '@/utils/interfaces';
import { sortOrderType } from '@/utils/types/common';
import { DEFAULT_VISIBLE_COLUMNS, RESULTS_TABLE_COLUMNS } from '@/utils/constants/common';
import { Dispatch, SetStateAction } from 'react';
import { useDisappearingNotification } from '@/hooks/useDisappearingNotification';

interface TableDesignContentProps {
  selectedRowIds: string[];
  setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>;
  tableRows: ColumnDefinition[];
  visibleColumns?: string[];
  columnsOrder?: ColumnDefinition[];
  setTableRows: React.Dispatch<React.SetStateAction<ColumnDefinition[]>>;
  sortOrder?: { id: string; order: sortOrderType }[];
  setSortOrder?: React.Dispatch<React.SetStateAction<{ id: string; order: sortOrderType }[]>>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  setColumnsOrder: Dispatch<SetStateAction<ColumnDefinition[]>>;
}

export default function TableDesignContent({
  selectedRowIds,
  setSelectedRowIds,
  tableRows,
  visibleColumns,
  columnsOrder,
  setTableRows,
  sortOrder,
  setSortOrder,
  setVisibleColumns,
  setColumnsOrder,
}: TableDesignContentProps) {
  const translations = useTranslations('TableDesignContent');

  const handleRowSelect = (rowId: string) => {
    setSelectedRowIds((prev: string[]) => {
      if (prev.includes(rowId)) {
        return prev.filter((id) => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };

  const handleSelectAll = () => {
    const allSelected = selectedRowIds.length === tableRows.length;
    const rowIds = tableRows.map((row) => row.id);

    if (selectedRowIds.length < tableRows.length) {
      setSelectedRowIds(rowIds);
    } else {
      setSelectedRowIds(allSelected ? [] : rowIds);
    }
  };

  const isNotificationVisible = useDisappearingNotification(selectedRowIds.length === 0);
  const getRowPosition = (id: string) => tableRows.findIndex((row) => row.id === id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTableRows((rows: ColumnDefinition[]) => {
        const originalPosition = getRowPosition(String(active.id));
        const newPosition = getRowPosition(String(over.id));
        return arrayMove(rows, originalPosition, newPosition);
      });
    }
  };

  // Handle sort order change for each row
  const handleSortOrderChange = (rowId: string, newSortOrder: sortOrderType) => {
    if (setSortOrder) {
      setSortOrder((prev) => {
        let updatedSortOrder = [...prev];
        if (newSortOrder !== 'none') {
          const existingIndex = updatedSortOrder.findIndex((item) => item.id === rowId);
          if (existingIndex !== -1) {
            updatedSortOrder[existingIndex].order = newSortOrder;
          } else {
            updatedSortOrder.push({ id: rowId, order: newSortOrder });
          }
        } else {
          // If the new order is 'none', remove the item from the sort array
          updatedSortOrder = prev.filter((order) => order.id !== rowId);
        }
        return updatedSortOrder;
      });
    }
  };

  const handleResetToDefaults = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setColumnsOrder(RESULTS_TABLE_COLUMNS);
    setSortOrder?.([]);
  };

  // All sensors used for drag and drop functionality (Pointer, Touch, and Keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isResetToDefaultsDisabled =
    JSON.stringify(visibleColumns) === JSON.stringify(DEFAULT_VISIBLE_COLUMNS) &&
    JSON.stringify(columnsOrder) === JSON.stringify(RESULTS_TABLE_COLUMNS) &&
    (sortOrder === undefined || sortOrder.length === 0);

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners} sensors={sensors}>
      <p className={styles.titleText}>{translations('description')}</p>
      <div className={styles.resetToDefaultsButtonContainerTableDesign}>
        <Button
          type="button"
          kind="secondary"
          onClick={handleResetToDefaults}
          disabled={isResetToDefaultsDisabled}
        >
          {translations('resetToDefaults')}
        </Button>
      </div>
      <div className={styles.tableDesignContainer}>
        <div className={styles.tableDesignHeaderRow}>
          <div className={styles.cellDragHandle}>
            <strong>{translations('dragAndDropHeader')}</strong>
          </div>
          <div className={styles.tableDesignCheckboxHeader}>
            <strong>{translations('showHideHeader')}</strong>
            <Checkbox
              aria-label="Select all rows"
              id="columns-checkbox-all"
              checked={selectedRowIds.length > 0 && selectedRowIds.length === tableRows.length}
              onChange={handleSelectAll}
            />
          </div>
          <div className={styles.cellValue}>
            <strong>{translations('columnName')}</strong>
          </div>
          <div className={styles.cellDropdownHeader}>
            <strong>{translations('sortOrderHeader')}</strong>
          </div>
        </div>
        <SortableContext
          items={tableRows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          {tableRows.map((row) => {
            const currentSort = sortOrder?.find((order) => order.id === row.id);
            return (
              <TableDesignRow
                key={row.id}
                rowId={row.id}
                currentSortOrder={currentSort?.order || 'none'}
                isSelected={selectedRowIds.includes(row.id)}
                onSelect={handleRowSelect}
                onSortOrderChange={handleSortOrderChange}
              />
            );
          })}
        </SortableContext>
        {selectedRowIds.length === 0 && isNotificationVisible && (
          <InlineNotification
            className={styles.notification}
            kind={'warning'}
            title={translations('warning')}
            subtitle={translations('noColumnsSelected')}
            hideCloseButton={true}
          />
        )}
      </div>
    </DndContext>
  );
}
