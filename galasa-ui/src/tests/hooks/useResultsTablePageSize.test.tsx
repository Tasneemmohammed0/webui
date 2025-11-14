/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import useResultsTablePageSize from '@/hooks/useResultsTablePageSize';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useResultsTablePageSize', () => {
  // reset localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  test('should initialize from localStorage', async () => {
    localStorage.setItem('resultsTablePageSize', JSON.stringify(20));
    const { result } = renderHook(() => useResultsTablePageSize());

    await waitFor(() => {
      expect(result.current.defaultPageSize).toBe(20);
    });
  });

  test('should update localStorage when page size changes', async () => {
    const { result } = renderHook(() => useResultsTablePageSize());

    act(() => {
      result.current.setDefaultPageSize(30);
    });

    await waitFor(() => {
      expect(localStorage.getItem('resultsTablePageSize')).toBe(String(30));
    });
  });

  test('should reset to default page size when the key is not stored in localStorage', async () => {
    const { result } = renderHook(() => useResultsTablePageSize());

    await waitFor(() => {
      // Default is 10
      expect(localStorage.getItem('resultsTablePageSize')).toBe(String(10));
    });
  });
});
