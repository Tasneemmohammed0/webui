/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import { Button, Search } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { FormEvent, useMemo, useState, useRef, useEffect } from 'react';

interface CustomSearchComponentProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  allRequestors?: string[];
  disableSaveAndReset: boolean;
}

/**
 * Search Component with an optional suggestion list if allRequestors is provided.
 *
 * @param title - The title of the search component.
 * @param placeholder - The placeholder text for the search input.
 * @param value - The current value of the search input.
 * @param onChange - Callback function to handle changes in the search input.
 * @param onClear - Callback function to handle clearing the search input.
 * @param onSubmit - Callback function to handle form submission.
 * @param onCancel - Callback function to handle cancellation.
 * @param allRequestors - Optional list of all requestors for suggestion.
 * @param disableSaveAndReset - Flag to disable the save and reset buttons when no changes are made.
 *
 * @returns The Search component.
 */
export default function CustomSearchComponent({
  title,
  placeholder,
  value,
  onChange,
  onClear,
  onSubmit,
  onCancel,
  allRequestors,
  disableSaveAndReset,
}: CustomSearchComponentProps) {
  const [isListVisible, setIsListVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const translations = useTranslations('CustomSearchComponent');
  const suggestionListRef = useRef<HTMLUListElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);

  const filteredRequestors = useMemo(() => {
    let currentRequestors = allRequestors || [];

    if (value && currentRequestors.length > 0) {
      currentRequestors = currentRequestors?.filter((name: string) =>
        name.toLowerCase().includes(value.toLowerCase())
      );
    }

    return currentRequestors;
  }, [value, allRequestors]);

  // Auto-scroll to active item when activeIndex changes
  useEffect(() => {
    if (activeItemRef.current && suggestionListRef.current && activeIndex >= 0) {
      const listElement = suggestionListRef.current;
      const activeElement = activeItemRef.current;

      const listRect = listElement.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      // Check if the active item is above the visible area
      if (activeRect.top < listRect.top) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      // Check if the active item is below the visible area
      else if (activeRect.bottom > listRect.bottom) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  const handleSelectRequestor = (name: string) => {
    onChange({ target: { value: name } } as React.ChangeEvent<HTMLInputElement>);
    setIsListVisible(false);
    setActiveIndex(-1);
  };

  const handleCancel = () => {
    onCancel();
    setIsListVisible(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
    setActiveIndex(-1);
    if (allRequestors && !isListVisible) {
      setIsListVisible(true);
    }
  };

  const handleClear = () => {
    onClear();
    setIsListVisible(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isListVisible && filteredRequestors.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex + 1) % filteredRequestors.length);
          break;

        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + filteredRequestors.length) % filteredRequestors.length
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < filteredRequestors.length) {
            handleSelectRequestor(filteredRequestors[activeIndex]);
          } else {
            // If no active index, submit the form with the current value
            onSubmit(event);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsListVisible(false);
          setActiveIndex(-1);
          break;

        default:
          break;
      }
    }
  };

  return (
    <form
      data-testid="custom-search-form"
      className={styles.filterInputContainer}
      onSubmit={onSubmit}
    >
      <div className={styles.customComponentWrapper}>
        <p>{title}</p>
        <div className={styles.suggestionContainer}>
          <Search
            id="search-input"
            placeholder={placeholder}
            size="md"
            type="text"
            value={value}
            onChange={handleInputChange}
            onClear={handleClear}
            onKeyDown={handleKeyDown}
            onFocus={() => allRequestors && setIsListVisible(true)}
            onBlur={() => setTimeout(() => setIsListVisible(false))}
          />
          {allRequestors && isListVisible && filteredRequestors.length > 0 && (
            <ul ref={suggestionListRef} className={styles.suggestionList}>
              {filteredRequestors.map((name: string, index: number) => (
                <li
                  key={name}
                  ref={index === activeIndex ? activeItemRef : null}
                  className={index === activeIndex ? styles.activeSuggestion : ''}
                  onMouseDown={() => handleSelectRequestor(name)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          type="button"
          kind="secondary"
          disabled={disableSaveAndReset}
          onClick={handleCancel}
        >
          {translations('reset')}
        </Button>
        <Button type="submit" disabled={disableSaveAndReset}>
          {translations('save')}
        </Button>
      </div>
    </form>
  );
}
