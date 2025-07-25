/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
"use client";
import styles from "@/styles/TestRunsPage.module.css";
import { 
  StructuredListWrapper, 
  StructuredListHead,
  StructuredListCell, 
  StructuredListRow, 
  StructuredListBody,
} from "@carbon/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import CustomSearchComponent from "./CustomSearchComponent";
import CustomCheckBoxList from "./CustomCheckBoxList";
import {TEST_RUNS_QUERY_PARAMS, TEST_RUNS_STATUS} from "@/utils/constants/common";
import CustomTagsComponent from "./CustomTagsComponent";
import { useTranslations } from "next-intl";
import { Button } from "@carbon/react";

interface FilterableField {
    id: string;
    label: string;
    description: string;
    placeHolder: string;
}

interface SearchCriteriaContentProps {
  requestorNamesPromise: Promise<string[]>;
  resultsNamesPromise: Promise<string[]>;
  searchCriteria: Record<string, string>;
  setSearchCriteria: (criteria: Record<string, string>) => void;
}


export default function SearchCriteriaContent({
  requestorNamesPromise, 
  resultsNamesPromise,
  searchCriteria,
  setSearchCriteria 
}: SearchCriteriaContentProps) {

  const translations = useTranslations("SearchCriteriaContent");

  const filterableFields: FilterableField[] = [
    {id: TEST_RUNS_QUERY_PARAMS.RUN_NAME, label: translations("fields.runName.label"), placeHolder: 'any', description: translations("fields.runName.description")},
    {id: TEST_RUNS_QUERY_PARAMS.REQUESTOR, label: translations("fields.requestor.label"), placeHolder: 'any', description: translations("fields.requestor.description")},
    {id: TEST_RUNS_QUERY_PARAMS.GROUP, label: translations("fields.group.label"), placeHolder: 'any', description: translations("fields.group.description")},
    {id: TEST_RUNS_QUERY_PARAMS.BUNDLE, label: translations("fields.bundle.label"), placeHolder: 'any', description: translations("fields.bundle.description")},
    {id: TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID, label: translations("fields.submissionId.label"), placeHolder: 'any', description: translations("fields.submissionId.description")},
    {id: TEST_RUNS_QUERY_PARAMS.TEST_NAME, label: translations("fields.testName.label"), placeHolder: 'any', description: translations("fields.testName.description")},
    {id: TEST_RUNS_QUERY_PARAMS.STATUS, label: translations("fields.status.label"), placeHolder: 'any', description: translations("fields.status.description")},
    {id: TEST_RUNS_QUERY_PARAMS.TAGS, label: translations("fields.tags.label"), placeHolder: 'any', description: translations("fields.tags.description")},
    {id: TEST_RUNS_QUERY_PARAMS.RESULT, label: translations("fields.result.label"), placeHolder: 'any', description: translations("fields.result.description")},
  ];

  // Local state for the UI of the "currently selected" filter editor
  const [selectedFilterId, setSelectedFilterId] = useState(filterableFields[0].id);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // State of fetched data
  const [allRequestors, setAllRequestors] = useState<string[]>([]);
  const [resultsNames, setResultsNames] = useState<string[]>([]);

  // Fetch all requestors on mount 
  useEffect(() => {
    const loadRequestors = async () => {
      try {
        const requestors = await requestorNamesPromise;
        setAllRequestors(requestors);
      } catch (error) {
        console.error("Error fetching requestors:", error);
      }
    };
    loadRequestors();
  }, [requestorNamesPromise]);

  // Fetch results names on mount
  useEffect(() => {
    const loadResultsNames = async () => {
      try {
        const resultsNames = await resultsNamesPromise;
        setResultsNames(resultsNames);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };
    loadResultsNames();
  }, [resultsNamesPromise]);

  // Sync the local UI state with the saved value from props (Source: URL)
  const handleFilterSelect = useCallback((fieldId: string) => {
    setSelectedFilterId(fieldId);
    const savedValue = searchCriteria[fieldId] || '';

    // Update the local UI state to match the newly selected filter's saved value
    setCurrentInputValue(savedValue);

    const splitSavedValue = savedValue ? savedValue.split(',') : [];
    if (fieldId === TEST_RUNS_QUERY_PARAMS.RESULT) {
      setSelectedResults(splitSavedValue);
    } else if (fieldId === TEST_RUNS_QUERY_PARAMS.STATUS) {
      setSelectedStatuses(splitSavedValue);
    } else if (fieldId === TEST_RUNS_QUERY_PARAMS.TAGS) {
      setSelectedTags(splitSavedValue);
    }
  }, [searchCriteria]);

  // Update the current input value on the first mount or when the selected filter changes
  useEffect(() => {
    handleFilterSelect(selectedFilterId);
  }, [selectedFilterId, handleFilterSelect]);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();

    // Determine the new value for the currently selected filter
    let valueToSet = '';
    if (selectedFilterId === TEST_RUNS_QUERY_PARAMS.RESULT) {
      valueToSet = selectedResults.join(',');
    } else if (selectedFilterId === TEST_RUNS_QUERY_PARAMS.STATUS) {
      valueToSet = selectedStatuses.join(',');
    } else if (selectedFilterId === TEST_RUNS_QUERY_PARAMS.TAGS) {
      valueToSet = selectedTags.join(',');
    } else {
      valueToSet = currentInputValue.trim();
    }

    const newCriteria = {...searchCriteria};

    // If the new value is not empty, set it. Otherwise, delete the key.
    if (valueToSet) {
      newCriteria[selectedFilterId] = valueToSet;
    } else {
      delete newCriteria[selectedFilterId];
    }

    // Call parent to update state and URL
    setSearchCriteria(newCriteria);
  };


  const handleCancel = () => {
    // Revert changes by re-running the selection logic
    handleFilterSelect(selectedFilterId);
  };

  const handleClearAndSave = (fieldId: string) => {
    if (selectedFilterId === fieldId) {
      setCurrentInputValue('');
    }
  
    const newCriteria = { ...searchCriteria };
    if (newCriteria[fieldId]) {
      delete newCriteria[fieldId]; 
      setSearchCriteria(newCriteria);
    }
  };

  const handleResetToDefaults = () => {
    // Clear states
    setCurrentInputValue('');
    setSelectedResults([]);
    setSelectedTags([]);
    setSelectedStatuses([]);

    // Call parent to clear all search criteria
    setSearchCriteria({});
  };

  // Determine if the Save and Reset button should be disabled
  const isSaveAndResetDisabled: boolean = (() => {
    // Get saved value from the query and compare it with the current input value
    const savedValue = searchCriteria[selectedFilterId] || '';
    let isDisabled = false;

    const splitSavedValue = savedValue ? savedValue.split(',').sort() : [];
    switch (selectedFilterId) {
    case 'result': {
      const savedResults = splitSavedValue;
      const currentResults = [...selectedResults].sort();
      isDisabled = JSON.stringify(savedResults) === JSON.stringify(currentResults);
      break;
    }

    case 'status': {
      const savedStatuses = splitSavedValue;
      const currentStatuses = [...selectedStatuses].sort();
      isDisabled = JSON.stringify(savedStatuses) === JSON.stringify(currentStatuses);
      break;
    }

    case 'tags': {
      const savedTags = splitSavedValue;
      const currentTags = [...selectedTags].sort();
      isDisabled = JSON.stringify(savedTags) === JSON.stringify(currentTags);
      break;
    }

    default: {
      // For other fields, compare trimmed values
      isDisabled = savedValue.trim() === currentInputValue.trim();
    }
    }
    return isDisabled;
  })();

  // Render the editor component based on the selected filter
  const renderComponent = (field: FilterableField) => {
    // Props for the search component
    const searchProps = {
      title: field.description,
      placeholder: field.placeHolder,
      value: currentInputValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCurrentInputValue(e.target.value),
      onClear: () => handleClearAndSave(field.id),
      onSubmit: handleSave,
      onCancel: handleCancel,
      disableSaveAndReset: isSaveAndResetDisabled,
    };

    // Props for the checkbox list component
    const checkboxProps = {
      title: field.description,
      items: (field.id === TEST_RUNS_QUERY_PARAMS.RESULT) ? resultsNames : Object.values(TEST_RUNS_STATUS),
      selectedItems: (field.id === TEST_RUNS_QUERY_PARAMS.RESULT) ? selectedResults : selectedStatuses,
      onChange: (field.id === TEST_RUNS_QUERY_PARAMS.RESULT) ? setSelectedResults : setSelectedStatuses, 
      onSubmit: handleSave,
      onCancel: handleCancel,
      disableSaveAndReset: isSaveAndResetDisabled,
    };

    // Props for the tags component 
    const tagsProps = {
      title: field.description,
      tags: selectedTags,
      onChange: setSelectedTags,
      onSubmit: handleSave,
      onCancel: handleCancel,
      disableSaveAndReset: isSaveAndResetDisabled,
    };

    let customComponent;
    switch (field.id) {
    case TEST_RUNS_QUERY_PARAMS.REQUESTOR:
      customComponent = <CustomSearchComponent {...searchProps}
        allRequestors={allRequestors} />;
      break;
    case TEST_RUNS_QUERY_PARAMS.RESULT:
    case TEST_RUNS_QUERY_PARAMS.STATUS:
      customComponent = <CustomCheckBoxList {...checkboxProps} />;
      break;
    case TEST_RUNS_QUERY_PARAMS.TAGS:
      customComponent = <CustomTagsComponent {...tagsProps} />;
      break;
    default:
      customComponent = <CustomSearchComponent {...searchProps} />;
      break;
    }
    return customComponent;
  };

  const isClearFiltersDisabled = Object.keys(searchCriteria).length === 0;
  const selectedFilterField = filterableFields.find(field => field.id === selectedFilterId) || filterableFields[0];


  return (
    <div>
      <p>{translations('description')}</p>
      <div className={styles.resetToDefaultsButtonContainerSearchCriteria}>
        <Button 
          type="button"
          kind="secondary"
          onClick={handleResetToDefaults}
          disabled={isClearFiltersDisabled}
        >
          {translations("clearFilters")}
        </Button>
      </div>
      <div className={styles.searchCriteriaContainer}>
        <div className={styles.structuredListContainer}>
          <StructuredListWrapper selection>
            <StructuredListHead>
              <StructuredListRow head>
                <div className={styles.rowWrapper}>
                  <StructuredListCell head>{translations('table.columnName')}</StructuredListCell>
                  <StructuredListCell head>{translations('table.allowedValues')}</StructuredListCell>
                </div>
              </StructuredListRow>
            </StructuredListHead>
            <StructuredListBody>
              {filterableFields.map((field) => (
                <StructuredListRow key={field.id}>
                  <div
                    key={field.id} 
                    onClick={() => handleFilterSelect(field.id)} 
                    className={`${styles.rowWrapper} ${selectedFilterId === field.id ? styles.selectedRow : ''}`}
                  >
                    <StructuredListCell>{field.label}</StructuredListCell>
                    <StructuredListCell>{searchCriteria[field.id] || field.placeHolder}</StructuredListCell>
                  </div>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        </div>
        {renderComponent(selectedFilterField)}
      </div>
    </div>
  );
};