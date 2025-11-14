/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

'use client';

import { createContext, ReactNode, useContext, useEffect } from 'react';
import { SavedQueriesMetaData, SavedQueryType } from '@/utils/types/common';
import { useState } from 'react';
import { DEFAULT_QUERY } from '@/utils/constants/defaultQuery';
const SAVED_QUERIES_STORAGE_KEY = 'savedQueries';
const QUERIES_METADATA_STORAGE_KEY = 'queriesMetaData';

type SavedQueriesContextType = {
  savedQueries: SavedQueryType[];
  setSavedQueries: (queries: SavedQueryType[]) => void;
  saveQuery: (query: SavedQueryType) => void;
  updateQuery: (createdAt: string, updatedQuery: SavedQueryType) => void;
  deleteQuery: (createdAt: string) => void;
  isQuerySaved: (queryName: string) => boolean;
  getQueryByName: (queryName: string) => SavedQueryType | null;
  defaultQuery: SavedQueryType;
  setDefaultQuery: (createdAt: string) => void;
};

const SavedQueriesContext = createContext<SavedQueriesContextType | undefined>(undefined);

export function SavedQueriesProvider({ children }: { children: ReactNode }) {
  const [savedQueries, setSavedQueries] = useState<SavedQueryType[]>(() => {
    if (typeof window !== 'undefined') {
      const storedQueries = localStorage.getItem(SAVED_QUERIES_STORAGE_KEY);
      if (storedQueries && storedQueries.length > 0) {
        return JSON.parse(storedQueries);
      }
    }

    // Initialize with default query if none are stored
    return [DEFAULT_QUERY];
  });

  const [metaData, setMetaData] = useState<SavedQueriesMetaData>(() => {
    if (typeof window !== 'undefined') {
      const storedMetaData = localStorage.getItem(QUERIES_METADATA_STORAGE_KEY);
      if (storedMetaData) {
        return JSON.parse(storedMetaData);
      }
    }
    return { defaultQueryId: DEFAULT_QUERY.createdAt };
  });

  // Find the default query based on metadata.
  const defaultQuery =
    savedQueries.find((query) => query.createdAt === metaData.defaultQueryId) || savedQueries[0];

  /**
   * Save a new query to the list of saved queries.
   * @param query The query to save.
   */
  const saveQuery = (query: SavedQueryType) => {
    setSavedQueries((prevQueries) => {
      const updatedQueries = [...prevQueries, query];
      return updatedQueries;
    });
  };

  const updateQuery = (createdAt: string, updatedQuery: SavedQueryType) => {
    setSavedQueries((prevQueries) => {
      const updatedQueries = prevQueries.map((query) =>
        query.createdAt === createdAt ? updatedQuery : query
      );
      return updatedQueries;
    });
  };

  /**
   * Delete a saved query.
   * If the deleted query is the default query:
   *   - If there are other queries, the top query in the list becomes the new default.
   *   - If it's the last query, a new default query is created and set as default.
   *
   * @param createdAt The createdAt of the query to delete.
   */
  const deleteQuery = (createdAt: string) => {
    setSavedQueries((prevQueries) => {
      const updatedQueries = prevQueries.filter((query) => query.createdAt !== createdAt);

      // Handle default query logic
      if (metaData.defaultQueryId === createdAt) {
        let newDefaultQueryId = DEFAULT_QUERY.createdAt;

        if (updatedQueries.length > 0) {
          // If there are other queries, set the first one as default
          newDefaultQueryId = updatedQueries[0].createdAt;
        } else {
          // If it's the last query, create a new default query and add it
          const newDefaultQuery = { ...DEFAULT_QUERY, createdAt: new Date().toISOString() };
          updatedQueries.push(newDefaultQuery);
          newDefaultQueryId = newDefaultQuery.createdAt;
        }

        setMetaData((prevMetaData) => ({
          ...prevMetaData,
          defaultQueryId: newDefaultQueryId,
        }));
      }

      setSavedQueries(updatedQueries);
      return updatedQueries;
    });
  };

  /**
   * Check if a query with the given name is saved.
   * @param queryName The name of the query to check.
   * @returns True if the query is saved, false otherwise.
   */
  const isQuerySaved = (queryName: string) => {
    return savedQueries.some((query) => query.title === queryName);
  };

  /**
   * Get a saved query by its name.
   * @param queryName The name of the query to retrieve.
   * @returns The saved query if found, null otherwise.
   */
  const getQueryByName = (queryName: string) => {
    return savedQueries.find((query) => query.title === queryName) || null;
  };

  /**
   * Set the default query by its createdAt timestamp.
   * @param createdAt The createdAt timestamp of the query to set as default.
   */
  const setDefaultQuery = (createdAt: string) => {
    setMetaData((prevMetaData) => ({
      ...prevMetaData,
      defaultQueryId: createdAt,
    }));

    // Update saved queries arrangement
    setSavedQueries((prevQueries) => {
      const updatedQueries = [...prevQueries];
      const movedQuery = updatedQueries.find((query) => query.createdAt === createdAt);
      if (movedQuery) {
        updatedQueries.splice(updatedQueries.indexOf(movedQuery), 1);
        updatedQueries.unshift(movedQuery);
      }

      return updatedQueries;
    });
  };

  useEffect(() => {
    localStorage.setItem(QUERIES_METADATA_STORAGE_KEY, JSON.stringify(metaData));
  }, [metaData]);

  useEffect(() => {
    localStorage.setItem(SAVED_QUERIES_STORAGE_KEY, JSON.stringify(savedQueries));
  }, [savedQueries]);

  const value = {
    savedQueries,
    setSavedQueries,
    saveQuery,
    deleteQuery,
    updateQuery,
    isQuerySaved,
    getQueryByName,
    defaultQuery,
    setDefaultQuery,
  };
  return <SavedQueriesContext.Provider value={value}>{children}</SavedQueriesContext.Provider>;
}

/**
 * Custom hook to easily access the saved queries context.
 * @returns An object containing saved queries and functions to manipulate them.
 */
export function useSavedQueries() {
  const context = useContext(SavedQueriesContext);

  if (context === undefined) {
    throw new Error('useSavedQueries must be used within a SavedQueriesProvider');
  }

  return context;
}
