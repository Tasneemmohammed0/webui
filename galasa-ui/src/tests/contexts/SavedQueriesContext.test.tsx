/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { SavedQueriesProvider, useSavedQueries } from '@/contexts/SavedQueriesContext';
import {
  DEFAULT_VISIBLE_COLUMNS,
  RESULTS_TABLE_COLUMNS,
  TEST_RUNS_QUERY_PARAMS,
  TEST_RUNS_STATUS,
} from '@/utils/constants/common';
import { DEFAULT_QUERY } from '@/utils/constants/defaultQuery';
import { SavedQueryType } from '@/utils/types/common';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create a spy so we can assert that setItem was called correctly
const localStorageSetItemSpy = jest.spyOn(window.localStorage, 'setItem');

// Mock constants
jest.mock('@/utils/constants/common', () => ({
  DEFAULT_QUERY: {
    createdAt: 'default-id',
    title: 'Tests ran in the last 24 hours',
    url: 'default-url',
  },
  TEST_RUNS_QUERY_PARAMS: {
    TAB: 'tab',
  },
  TEST_RUNS_STATUS: {},
  RESULTS_TABLE_COLUMNS: [],
  DEFAULT_VISIBLE_COLUMNS: [],
}));

// Test Component to consume and interact with the context
const TestComponent = () => {
  const {
    savedQueries,
    setSavedQueries,
    saveQuery,
    updateQuery,
    deleteQuery,
    isQuerySaved,
    getQueryByName,
    defaultQuery,
    setDefaultQuery,
  } = useSavedQueries();

  const newQuery: SavedQueryType = {
    createdAt: 'new-query-id',
    title: 'New Query',
    url: 'new-url',
  };
  // Check if savedQueries has enough items before trying to reorder
  const reorderedQueries: SavedQueryType[] =
    savedQueries.length > 2
      ? [savedQueries[0], savedQueries[2], savedQueries[1]]
      : [...savedQueries];

  return (
    <div>
      <p>Saved Queries: {JSON.stringify(savedQueries.map((q) => q.title))}</p>
      <p>Default Query: {defaultQuery?.title}</p>
      <p>Is `New Query` Saved: {isQuerySaved('New Query').toString()}</p>

      <button onClick={() => saveQuery(newQuery)}>Save New Query</button>
      <button
        onClick={() =>
          updateQuery('existing-id', { ...getQueryByName('Existing Query')!, url: 'updated-url' })
        }
      >
        Update Existing Query
      </button>
      <button onClick={() => deleteQuery('existing-id')}>Delete Existing Query</button>
      <button onClick={() => setDefaultQuery('another-id')}>Set New Default</button>
      <button onClick={() => setSavedQueries(reorderedQueries)}>Reorder Queries</button>
    </div>
  );
};

describe('SavedQueriesContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageSetItemSpy.mockClear();
  });

  describe('Initialization', () => {
    test('should initialize with the default query when localStorage is empty', () => {
      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      expect(screen.getByText(`Saved Queries: ["${DEFAULT_QUERY.title}"]`)).toBeInTheDocument();
      expect(screen.getByText(`Default Query: ${DEFAULT_QUERY.title}`)).toBeInTheDocument();
    });

    test('should initialize with queries from localStorage if they exist', () => {
      const storedQueries = [
        DEFAULT_QUERY,
        { createdAt: 'existing-id', title: 'Existing Query', url: 'existing-url' },
      ];
      localStorage.setItem('savedQueries', JSON.stringify(storedQueries));

      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      expect(
        screen.getByText('Saved Queries: ["Tests ran in the last 24 hours","Existing Query"]')
      ).toBeInTheDocument();
      expect(screen.getByText('Default Query: Tests ran in the last 24 hours')).toBeInTheDocument();
    });

    test('should correctly identify the default query from metadata in localStorage', () => {
      const storedQueries = [
        DEFAULT_QUERY,
        { createdAt: 'another-id', title: 'Another Query', url: 'another-url' },
      ];
      localStorage.setItem('savedQueries', JSON.stringify(storedQueries));
      localStorage.setItem('queriesMetaData', JSON.stringify({ defaultQueryId: 'another-id' }));

      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      expect(
        screen.getByText('Saved Queries: ["Tests ran in the last 24 hours","Another Query"]')
      ).toBeInTheDocument();
      expect(screen.getByText('Default Query: Another Query')).toBeInTheDocument();
    });
  });

  describe('State Management Functions', () => {
    const initialQueries: SavedQueryType[] = [
      DEFAULT_QUERY,
      { createdAt: 'existing-id', title: 'Existing Query', url: 'existing-url' },
      { createdAt: 'another-id', title: 'Another Query', url: 'another-url' },
    ];

    test('should save a new query and update localStorage', async () => {
      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Save New Query' }));

      await waitFor(() => {
        expect(screen.getByText('Is `New Query` Saved: true')).toBeInTheDocument();
        expect(localStorageSetItemSpy).toHaveBeenCalledWith(
          'savedQueries',
          expect.stringContaining('"title":"New Query"')
        );
      });
    });

    test('should update an existing query and localStorage', async () => {
      localStorage.setItem('savedQueries', JSON.stringify(initialQueries));
      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Update Existing Query' }));

      await waitFor(() => {
        expect(localStorageSetItemSpy).toHaveBeenCalledWith(
          'savedQueries',
          expect.stringContaining('"url":"updated-url"')
        );
      });
    });

    test('should delete an existing query and localStorage', async () => {
      localStorage.setItem('savedQueries', JSON.stringify(initialQueries));
      render(
        <SavedQueriesProvider>
          <TestComponent />
        </SavedQueriesProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete Existing Query' }));

      await waitFor(() => {
        expect(
          screen.getByText('Saved Queries: ["Tests ran in the last 24 hours","Another Query"]')
        ).toBeInTheDocument();
        expect(localStorageSetItemSpy).toHaveBeenCalledWith(
          'savedQueries',
          expect.not.stringContaining('"title":"Existing Query"')
        );
      });
    });
  });
});
