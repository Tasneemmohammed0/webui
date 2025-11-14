/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import { RESULTS_TABLE_PAGE_SIZES } from '@/utils/constants/common';
import { useEffect, useState } from 'react';

const LOCAL_STORAGE_KEY = 'resultsTablePageSize';

export default function useResultsTablePageSize() {
  const [defaultPageSize, setDefaultPageSize] = useState<number>(() => {
    // Load the default page size initially from the localStorage
    const storedPageSize = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedPageSize ? Number(storedPageSize) : RESULTS_TABLE_PAGE_SIZES[0];
  });

  // Save the default page size to localStorage whenever changed
  useEffect(() => {
    if (defaultPageSize !== null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(defaultPageSize));
    }
  }, [defaultPageSize]);

  return {
    defaultPageSize,
    setDefaultPageSize,
  };
}
