/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { TEST_RUNS_QUERY_PARAMS, TABS_IDS, TEST_RUNS_STATUS } from "./constants/common";

// Mappings for keys and values to minify the URL state
const keyMap: Record<string, string> = {
  [TEST_RUNS_QUERY_PARAMS.TAB]: 't',
  [TEST_RUNS_QUERY_PARAMS.FROM]: 'f',
  [TEST_RUNS_QUERY_PARAMS.TO]: 'to',
  [TEST_RUNS_QUERY_PARAMS.RUN_NAME]: 'rn',
  [TEST_RUNS_QUERY_PARAMS.REQUESTOR]: 'r',
  [TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID]: 'sid',
  [TEST_RUNS_QUERY_PARAMS.GROUP]: 'g',
  [TEST_RUNS_QUERY_PARAMS.BUNDLE]: 'b',
  [TEST_RUNS_QUERY_PARAMS.PACKAGE]: 'p',
  [TEST_RUNS_QUERY_PARAMS.TEST_NAME]: 'tn',
  [TEST_RUNS_QUERY_PARAMS.STATUS]: 's',
  [TEST_RUNS_QUERY_PARAMS.RESULT]: 'res',
  [TEST_RUNS_QUERY_PARAMS.TAGS]: 'tgs',
  [TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS]: 'vc',
  [TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER]: 'co',
  [TEST_RUNS_QUERY_PARAMS.SORT_ORDER]: 'so',
};

const valueMap: Record<string, string> = {
  // Tabs
  'timeframe': 'tf', 'table-design': 'td', 'search-criteria': 'sc', 'results': 'r',
  // Columns
  submittedAt: 'sA', runName: 'rn', requestor: 'rq', testName: 'tn',
  status: 'st', result: 'rs', submissionId: 'sid', group: 'g', bundle: 'b',
  package: 'p', tags: 'tgs',
  // Results
  'Passed': 'Pa', 'Failed': 'Fa', 'Requeued': 'Re', 'Ignored': 'Ig', 'Hung': 'Hu', 'EnvFail':'En', 'Cancelled': 'Ca',
  // Statuses
  [TEST_RUNS_STATUS.QUEUED]: 'Q',
  [TEST_RUNS_STATUS.STARTED]: 'S',
  [TEST_RUNS_STATUS.GENERATING]: 'G',
  [TEST_RUNS_STATUS.BUILDING]: 'B',
  [TEST_RUNS_STATUS.PROVSTART]: 'PS',
  [TEST_RUNS_STATUS.RUNNING]: 'R',
  [TEST_RUNS_STATUS.RUNDONE]: 'RD',
  [TEST_RUNS_STATUS.ENDING]: 'E',
  [TEST_RUNS_STATUS.FINISHED]: 'F',
  // Sort orders
  'asc':'a', 'desc': 'd', 'undefined': 'u', '': 'e',
};

// Reverse maps
const reverseKeyMap: Record<string, string> = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]));
const reverseValueMap: Record<string, string> = Object.fromEntries(Object.entries(valueMap).map(([k, v]) => [v, k]));

// HELPER FUNCTIONS FOR VALUE TRANSFORMATIONS
const minifyListValue = (list: string) => list.split(',').map(item => valueMap[item] || item).join(',');
const expandListValue = (minifiedList: string) => minifiedList.split(',').map(item => reverseValueMap[item] || item).join(',');

const minifySortOrder = (sortString: string) => {
  return sortString.split(',')
    .map(pair => {
      const [id, order] = pair.split(':');
      const minId = valueMap[id] || id;
      const minOrder = valueMap[order] || order;
      return `${minId}:${minOrder}`;
    })
    .join(',');
};
const expandSortOrder = (minifiedSortString: string) => {
  return minifiedSortString.split(',')
    .map(pair => {
      const [minId, minOrder] = pair.split(':');
      const id = reverseValueMap[minId] || minId;
      const order = reverseValueMap[minOrder] || minOrder;
      return `${id}:${order}`;
    })
    .join(',');
};

// Transforms values based on their key
const minifyValue = (key: string, value: string): string | number => {
  switch (key) {
  case  TEST_RUNS_QUERY_PARAMS.FROM:
  case TEST_RUNS_QUERY_PARAMS.TO:
    // Convert ISO date to a much shorter base-36 timestamp
    return new Date(value).getTime().toString(36);
  case TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS:
  case TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER:
  case TEST_RUNS_QUERY_PARAMS.STATUS:
  case TEST_RUNS_QUERY_PARAMS.RESULT:
    return minifyListValue(value);
  case TEST_RUNS_QUERY_PARAMS.TAB:
    return valueMap[value] || value;
  case TEST_RUNS_QUERY_PARAMS.SORT_ORDER:
    return minifySortOrder(value);
  default:
    return value;
  }
};

// Retrieve values based on their key
const expandValue = (key: string, value: string | number): string => {
  switch (key) {
  case TEST_RUNS_QUERY_PARAMS.FROM:
  case TEST_RUNS_QUERY_PARAMS.TO:
    // Convert base-36 timestamp back to ISO string
    return new Date(parseInt(value.toString(), 36)).toISOString();
  case TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS:
  case TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER:
  case TEST_RUNS_QUERY_PARAMS.STATUS:
  case TEST_RUNS_QUERY_PARAMS.RESULT:
    return expandListValue(value.toString());
  case TEST_RUNS_QUERY_PARAMS.TAB:
    return reverseValueMap[value.toString()] || value.toString();
  case TEST_RUNS_QUERY_PARAMS.SORT_ORDER:
    return expandSortOrder(value.toString());
  default:
    return value.toString();
  }
};


/***
 * Minify the state object by replacing keys and values with shorter representations.
 * 
 * @param state - The state object to minify.
 * @return A new object with minified keys and values.
 */
export function minifyState(state: Record<string, any>): Record<string, any> {
  const minifiedState: Record<string, any> = {};
  for (const key in state) {
    const minKey = keyMap[key] || key; 
    const minValue = minifyValue(key, state[key]); 
    minifiedState[minKey] = minValue;
  }
  return minifiedState;
}

/**
 * Expands the state object by replacing minified keys and values with their original representations.
 *
 * @param state - The state object to expand. 
 * @returns A new object with expanded keys and values.
 */
export function expandState(state: Record<string, any>): Record<string, any> {
  const expandedState: Record<string, any> = {};
  for (const key in state) {
    const expandedKey = reverseKeyMap[key] || key; 
    const expandedValue = expandValue(expandedKey, state[key]); 
    expandedState[expandedKey] = expandedValue;
  }
  return expandedState;
}