/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
import styles from "@/styles/TestRunsPage.module.css";
import { 
  Checkbox,
  CheckboxGroup 
} from "@carbon/react";
import { Button } from "@carbon/react";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

interface CheckBoxListProps {
    title: string;
    items: string[];
    selectedItems: string[];
    onChange: (newSelectedItems: string[]) => void;
    onSubmit: (e: FormEvent) => void;
    onCancel: () => void;
    disableSaveAndReset: boolean;
  }
  
/**
 * CheckBoxList component for displaying a list of checkboxes.
 * @param title - The title of the checkbox list.
 * @param items - The list of items to display as checkboxes.
 * @param selectedItems - The currently selected items.
 * @param onChange - Callback function to handle changes in selected items.
 * @param onSubmit - Callback function to handle form submission.
 * @param onCancel - Callback function to handle cancellation.
 * @param disableSaveAndReset - Flag to disable the save and reset buttons when no changes are made.
 * 
 * @returns The CheckBoxList component.
 */
export default function CheckBoxList({ title, items, selectedItems, onChange, onSubmit, onCancel, disableSaveAndReset}: CheckBoxListProps) {
  const translations = useTranslations('CustomCheckBoxList');
  const areAllSelected = items.length > 0 && selectedItems.length === items.length;

  const handleItemChange = (checked: boolean, name: string) => {
    if (checked) {
      onChange([...selectedItems, name]);
    } else {
      // Remove the item from selectedItems
      onChange(selectedItems.filter(item=> item !==name));
    }
  };
  
  const handleAllChange = (checked: boolean) => {
    onChange(checked ? items : []);
  };
  
  return (
    <form className={styles.filterInputContainer} onSubmit={onSubmit}>
      <p>{title}</p>
      <CheckboxGroup
        className={styles.checkBoxList}
      >
        <Checkbox
          id="status-checkbox-all"
          labelText="All"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleAllChange(event.target.checked)} 
          checked={areAllSelected}
          className={styles.customCheckboxAll}
        />
        {items.map((name: string) => (
          <Checkbox
            key={name}
            id={`checkbox-${name}`}
            labelText={name.charAt(0).toUpperCase() + name.slice(1)}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleItemChange(event.target.checked, name)}
            checked={selectedItems.includes(name)}
          />
        ))}
      </CheckboxGroup>
      <div className={styles.buttonContainer}>
        <Button type="button" disabled={disableSaveAndReset} kind="secondary" onClick={onCancel}>{translations('reset')}</Button>
        <Button type="submit" disabled={disableSaveAndReset}>{translations('save')}</Button>
      </div>
    </form>
  );
};