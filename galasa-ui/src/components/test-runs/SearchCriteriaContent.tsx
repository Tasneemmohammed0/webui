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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import CustomSearchComponent from "./CustomSearchComponent";
import CustomCheckBoxList from "./CustomCheckBoxList";
import {RUN_QUERY_PARAMS, TEST_RUNS_STATUS} from "@/utils/constants/common";
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
}


export default function SearchCriteriaContent({requestorNamesPromise, resultsNamesPromise}: SearchCriteriaContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const translations = useTranslations("SearchCriteriaContent");


  const filterableFields: FilterableField[] = [
    {id: RUN_QUERY_PARAMS.RUN_NAME, label: translations("fields.runName.label"), placeHolder: 'any', description: translations("fields.runName.description")},
    {id: RUN_QUERY_PARAMS.REQUESTOR, label: translations("fields.requestor.label"), placeHolder: 'any', description: translations("fields.requestor.description")},
    {id: RUN_QUERY_PARAMS.GROUP, label: translations("fields.group.label"), placeHolder: 'any', description: translations("fields.group.description")},
    {id: RUN_QUERY_PARAMS.BUNDLE, label: translations("fields.bundle.label"), placeHolder: 'any', description: translations("fields.bundle.description")},
    {id: RUN_QUERY_PARAMS.SUBMISSION_ID, label: translations("fields.submissionId.label"), placeHolder: 'any', description: translations("fields.submissionId.description")},
    {id: RUN_QUERY_PARAMS.TEST_NAME, label: translations("fields.testName.label"), placeHolder: 'any', description: translations("fields.testName.description")},
    {id: RUN_QUERY_PARAMS.STATUS, label: translations("fields.status.label"), placeHolder: 'any', description: translations("fields.status.description")},
    {id: RUN_QUERY_PARAMS.TAGS, label: translations("fields.tags.label"), placeHolder: 'any', description: translations("fields.tags.description")},
    {id: RUN_QUERY_PARAMS.RESULT, label: translations("fields.result.label"), placeHolder: 'any', description: translations("fields.result.description")},
  ];

  const [selectedFilterId, setSelectedFilterId] = useState(filterableFields[0].id);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [allRequestors, setAllRequestors] = useState<string[]>([]);
  const [resultsNames, setResultsNames] = useState<string[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Initialize the saved query state directly from the URL
  const [query, setQuery] = useState(() => {
    const initialQuery : Map<string, string> = new Map();
    filterableFields.forEach(field => {
      const value = searchParams.get(field.id);
      if (value) {
        // Set the value in the initial query map
        initialQuery.set(field.id, value);

        // If the field is 'result' or 'status' or 'tags', split the value into an array and set the corresponding state
        if (field.id === RUN_QUERY_PARAMS.RESULT) {
          setSelectedResults(value.split(','));
        } else if (field.id === RUN_QUERY_PARAMS.STATUS) {
          setSelectedStatuses(value.split(','));
        } else if (field.id === RUN_QUERY_PARAMS.TAGS) {
          setSelectedTags(value.split(','));
        } 
      } 
    });

    return initialQuery;
  });

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

  // Get all results names
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

  // Update the current input value on the first mount or when the selected filter changes
  useEffect(() => {
    handleFilterSelect(selectedFilterId);
  }, [selectedFilterId]);


  // Update the current input value when the selected filter changes or when the query is updated
  const handleFilterSelect = (fieldId: string) => {
    setSelectedFilterId(fieldId);
    const savedValue = query.get(fieldId) || '';

    // Update the local UI state to match the newly selected filter's saved value
    setCurrentInputValue(savedValue);

    const splitSavedValue = savedValue ? savedValue.split(',') : [];
    if (fieldId === RUN_QUERY_PARAMS.RESULT) {
      setSelectedResults(splitSavedValue);
    } else if (fieldId === RUN_QUERY_PARAMS.STATUS) {
      setSelectedStatuses(splitSavedValue);
    } else if (fieldId === RUN_QUERY_PARAMS.TAGS) {
      setSelectedTags(splitSavedValue);
    }
  };

  const updateQueryAndUrl = (newQuery: Map<string, string>) => {
    // Update the component's query state
    setQuery(newQuery);
  
    // Synchronize the browser's URL with the new query
    const params = new URLSearchParams(searchParams.toString());
    filterableFields.forEach(field => {
      if (newQuery.has(field.id)) {
        params.set(field.id, newQuery.get(field.id)!);
      } else {
        params.delete(field.id);
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();

    // Determine the new value for the currently selected filter
    let valueToSet = '';
    if (selectedFilterId === RUN_QUERY_PARAMS.RESULT) {
      valueToSet = selectedResults.join(',');
    } else if (selectedFilterId === RUN_QUERY_PARAMS.STATUS) {
      valueToSet = selectedStatuses.join(',');
    } else if (selectedFilterId === RUN_QUERY_PARAMS.TAGS) {
      valueToSet = selectedTags.join(',');
    } else {
      valueToSet = currentInputValue.trim();
    }

    const newQuery = new Map(query);

    // If the new value is not empty, set it. Otherwise, delete the key.
    if (valueToSet) {
      newQuery.set(selectedFilterId, valueToSet);
    } else {
      // If the value is empty, remove the key from the query
      newQuery.delete(selectedFilterId);
    }

    // Update the URL with the new query parameters and set the query state
    updateQueryAndUrl(newQuery);
  };


  const handleCancel = () => {
    // Revert changes by re-running the selection logic
    handleFilterSelect(selectedFilterId);
  };

  const handleClearAndSave = (fieldId: string) => {
    if (selectedFilterId === fieldId) {
      setCurrentInputValue('');
    }
  
    const newQuery = new Map(query);
    if (newQuery.has(fieldId)) {
      newQuery.delete(fieldId); 
      updateQueryAndUrl(newQuery);
    }
  };

  const handleResetToDefaults = () => {
    // Clear states
    setCurrentInputValue('');
    setSelectedResults([]);
    setSelectedTags([]);
    setSelectedStatuses([]);

    // Update the query with default empty states
    updateQueryAndUrl(new Map());
  };

  // Determine if the Save and Reset button should be disabled
  const isSaveAndResetDisabled: boolean = (() => {
    // Get saved value from the query and compare it with the current input value
    const savedValue = query.get(selectedFilterId) || '';
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
      items: (field.id === RUN_QUERY_PARAMS.RESULT) ? resultsNames : TEST_RUNS_STATUS,
      selectedItems: (field.id === RUN_QUERY_PARAMS.RESULT) ? selectedResults : selectedStatuses,
      onChange: (field.id === RUN_QUERY_PARAMS.RESULT) ? setSelectedResults : setSelectedStatuses, 
      onSubmit: handleSave,
      onCancel: handleCancel,
      disableSaveAndReset: isSaveAndResetDisabled,
    };

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
    case RUN_QUERY_PARAMS.REQUESTOR:
      customComponent = <CustomSearchComponent {...searchProps}
        allRequestors={allRequestors} />;
      break;
    case RUN_QUERY_PARAMS.RESULT:
    case RUN_QUERY_PARAMS.STATUS:
      customComponent = <CustomCheckBoxList {...checkboxProps} />;
      break;
    case RUN_QUERY_PARAMS.TAGS:
      customComponent = <CustomTagsComponent {...tagsProps} />;
      break;
    default:
      customComponent = <CustomSearchComponent {...searchProps} />;
      break;
    }
    return customComponent;
  };

  const isClearFiltersDisabled = query.size === 0;
  const selectedFilterField = filterableFields.find(field => field.id === selectedFilterId) || filterableFields[0];


  return (
    <div>
      <p>{translations('description')}</p>
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
                    <StructuredListCell>{query.get(field.id) || field.placeHolder}</StructuredListCell>
                  </div>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        </div>
        {renderComponent(selectedFilterField)}
      </div>
      <Button 
        type="button"
        kind="secondary"
        className={styles.resetToDefaultsButton}
        onClick={handleResetToDefaults}
        disabled={isClearFiltersDisabled}
      >
        {translations("clearFilters")}
      </Button>
    </div>
  );
};