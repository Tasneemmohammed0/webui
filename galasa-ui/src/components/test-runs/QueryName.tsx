/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import styles from '@/styles/test-runs/TestRunsPage.module.css';
import { Button, SkeletonText } from '@carbon/react';
import { Edit } from '@carbon/icons-react';
import { useTestRunsQueryParams } from '@/contexts/TestRunsQueryParamsContext';

interface QueryNameProps {
  inputRef: React.RefObject<HTMLInputElement>;
  isEditingName: boolean;
  editedName: string;
  setEditedName: React.Dispatch<React.SetStateAction<string>>;
  handleFinishEditing: () => void;
  handleStartEditingName: (name: string) => void;
  translations: (key: string) => string;
}

/**
 * QueryName component displays and edits the name of a query.
 * It shows a text input when editing is enabled, and a heading with the query name otherwise.
 */
export default function QueryName({
  inputRef,
  isEditingName,
  editedName,
  setEditedName,
  handleFinishEditing,
  handleStartEditingName,
  translations,
}: QueryNameProps) {
  const { queryName } = useTestRunsQueryParams();

  return (
    <div className={styles.queryNameBlock}>
      <div className={styles.queryNameBlock}>
        {!queryName ? (
          <SkeletonText heading />
        ) : (
          <>
            {isEditingName ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleFinishEditing}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleFinishEditing();
                  }
                }}
                className={styles.queryNameInput}
              />
            ) : (
              <h3 className={styles.queryNameHeading}>{queryName}</h3>
            )}
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={Edit}
              iconDescription={translations('editQueryName')}
              onClick={handleStartEditingName.bind(null, queryName)}
              size="md"
            />
          </>
        )}
      </div>
    </div>
  );
}
