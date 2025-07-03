/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
import { closestCorners, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import styles from "@/styles/TestRunsPage.module.css";
import TableDesignRow from "./TableDesignRow";
import { Checkbox } from "@carbon/react";
import { useTranslations } from "next-intl";
import { InlineNotification } from "@carbon/react";


interface TableDesignContentProps {
    selectedRowIds: string[];
    setSelectedRowIds: React.Dispatch<React.SetStateAction<string[]>>;
    tableRows: { id: string; columnName: string }[];
    setTableRows: React.Dispatch<React.SetStateAction<{ id: string; columnName: string }[]>>;
}

export default function TableDesignContent({selectedRowIds, setSelectedRowIds, tableRows, setTableRows}: TableDesignContentProps) {
  const translations = useTranslations("TableDesignContent"); 
  const handleRowSelect = (rowId: string) => {
    setSelectedRowIds((prev: string[]) => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };

  const handleSelectAll = () => {
    const allSelected = selectedRowIds.length === tableRows.length;
    const rowIds = tableRows.map(row => row.id);

    if (selectedRowIds.length < tableRows.length) {
      setSelectedRowIds(rowIds);
    } else {
      setSelectedRowIds(allSelected ? [] : rowIds); 
    }
  };

  const getRowPosition = (id: string) => tableRows.findIndex(row => row.id === id);


  const handleDragEnd = (event: DragEndEvent) => {
    const { active , over } = event;

    if (over && active.id !== over.id) {
      setTableRows((rows: { id: string; columnName: string }[]) => {
        const originalPosition = getRowPosition(String(active.id));
        const newPosition = getRowPosition(String(over.id));
        return arrayMove(rows, originalPosition, newPosition);
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      console.log("Moving up", index);
      setTableRows((rows) => {
        const newRows = [...rows];
        const temp = newRows[index - 1];
        newRows[index - 1] = newRows[index];
        newRows[index] = temp;
        return newRows;
      });
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < tableRows.length - 1) {
      console.log("Moving down", index);
      setTableRows((rows) => {
        const newRows = [...rows];
        const temp = newRows[index + 1];
        newRows[index + 1] = newRows[index];
        newRows[index] = temp;
        return newRows;
      });
    }
  };

  // All sensors used for drag and drop functionality (Pointer, Touch, and Keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext 
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
      sensors={sensors}
    >
      <p className={styles.titleText}>{translations("description")}</p>
      <div className={styles.tableDesignContainer}>
        <div className={styles.tableDesignHeaderRow}>
          <div className={styles.cellDragHandle}>
            <strong>{translations("dragAndDropHeader")}</strong>
          </div>
          <div className={styles.tableDesignCheckboxHeader}>
            <strong>{translations("showHideHeader")}</strong>
            <Checkbox
              aria-label="Select all rows" 
              id="columns-checkbox-all"
              checked={selectedRowIds.length > 0 && selectedRowIds.length === tableRows.length}
              onChange={handleSelectAll}
            />
          </div>
          <div className={styles.cellValue}>
            <strong>{translations("columnName")}</strong>
          </div>
        </div>
        <SortableContext items={tableRows.map(row => row.id)} strategy={verticalListSortingStrategy}>
          {
            tableRows.map((row, index) => (
              <TableDesignRow 
                key={row.id} 
                index={index}
                rowId={row.id} 
                isSelected={selectedRowIds.includes(row.id)}
                onSelect={handleRowSelect}
                onClickArrowUp={() => handleMoveUp(index)}
                onClickArrowDown={() => handleMoveDown(index)}
              />
            )) 
          }
        </SortableContext>
        {
          selectedRowIds.length === 0 && 
          <InlineNotification
            className={styles.notification}
            kind={"warning"} 
            title={translations("warning")}
            subtitle={translations("noColumnsSelected")}
            hideCloseButton={true}
          />
        }
      </div>
    </DndContext>
  );
}