/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import { useState, FormEvent } from 'react';
import { Button, TextInput } from '@carbon/react';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import { useTranslations } from 'next-intl';

interface CustomTagsComponentProps {
  title: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  disableSaveAndReset: boolean;
}

/**
 * CustomTagsComponent allows users to add, remove, and manage tags.
 *
 * @param title - The title of the custom tags component.
 * @param tags - The current list of tags.
 * @param onChange - Callback function to handle changes in the tags.
 * @param onSubmit - Callback function to handle form submission.
 * @param onCancel - Callback function to handle cancellation of the operation.
 * @param disableSaveAndReset - Flag to disable the save and reset buttons when no changes are made.
 *
 * @returns The CustomTagsComponent for managing tags.
 */
export default function CustomTagsComponent({
  title,
  tags,
  onChange,
  onSubmit,
  onCancel,
  disableSaveAndReset,
}: CustomTagsComponentProps) {
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([]);
  const translations = useTranslations('CustomTagsComponent');

  const handleAddTag = () => {
    const newTag = currentTagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      onChange([...tags, newTag]);
    }
    setCurrentTagInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTags = () => {
    const newTags = tags.filter((tag) => !selectedForRemoval.includes(tag));
    onChange(newTags);
    setSelectedForRemoval([]);
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedForRemoval(selectedOptions);
  };

  return (
    <form className={styles.filterInputContainer} onSubmit={onSubmit}>
      <div className={styles.customComponentWrapper}>
        <p>{title}</p>
        <div className={styles.tagInputWrapper}>
          <TextInput
            id="tag-input"
            labelText=""
            hideLabel
            placeholder="any"
            value={currentTagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentTagInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />
          <div className={styles.tagsButtonContainer}>
            <Button
              type="button"
              kind="secondary"
              className={styles.removeTagButton}
              onClick={handleRemoveTags}
              disabled={selectedForRemoval.length === 0}
            >
              {translations('remove')}
            </Button>
            <Button type="button" onClick={handleAddTag}>
              {translations('add')}
            </Button>
          </div>
        </div>

        <select
          multiple
          className={styles.tagsListbox}
          onChange={handleSelectionChange}
          value={selectedForRemoval}
        >
          {tags.map((tag) => (
            <option key={tag} value={tag} className={styles.tagOption}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.buttonContainer}>
        <Button type="button" disabled={disableSaveAndReset} kind="secondary" onClick={onCancel}>
          {translations('reset')}
        </Button>
        <Button type="submit" disabled={disableSaveAndReset}>
          {translations('save')}
        </Button>
      </div>
    </form>
  );
}
