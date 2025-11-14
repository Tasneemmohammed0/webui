/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import { Checkbox } from '@carbon/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton } from '@carbon/react';
import { Draggable } from '@carbon/icons-react';
import { useTranslations } from 'next-intl';
import { Dropdown } from '@carbon/react';
import { sortOrderType } from '@/utils/types/common';

interface TableDesignRowProps {
  rowId: string;
  isSelected: boolean;
  currentSortOrder: sortOrderType;
  onSelect: (rowId: string) => void;
  onSortOrderChange: (rowId: string, sortOrder: sortOrderType) => void;
}

export default function TableDesignRow({
  rowId,
  isSelected,
  currentSortOrder,
  onSelect,
  onSortOrderChange,
}: TableDesignRowProps) {
  const translations = useTranslations('TableDesignRow');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortItems = [
    { text: translations('none'), value: 'none' },
    { text: translations('asc'), value: 'asc' },
    { text: translations('desc'), value: 'desc' },
  ];

  const selectedItem = sortItems.find((item) => item.value === currentSortOrder) || sortItems[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${styles.tableDesignRow} ${isDragging ? styles.dragging : ''}`}
      id={rowId}
    >
      <div className={styles.tableDesignIcons}>
        <IconButton
          kind="ghost"
          label={translations('dragAndDropLabel')}
          className={styles.dragHandle}
          {...listeners}
        >
          <Draggable size={20} />
        </IconButton>
      </div>

      <div className={styles.cellCheckbox}>
        <Checkbox id={`checkbox-${rowId}`} checked={isSelected} onChange={() => onSelect(rowId)} />
      </div>

      <p className={styles.cellValue}>{translations(rowId)}</p>

      <div className={styles.cellDropdown}>
        <Dropdown
          id={`dropdown-${rowId}`}
          selectedItem={selectedItem}
          items={sortItems}
          label="Sort Order"
          type="inline"
          itemToString={(item: { text: string; value: string }) => item.text}
          onChange={({
            selectedItem,
          }: {
            selectedItem: { text: string; value: sortOrderType };
          }) => {
            if (selectedItem) {
              onSortOrderChange(rowId, selectedItem.value);
            }
          }}
        />
      </div>
    </div>
  );
}
