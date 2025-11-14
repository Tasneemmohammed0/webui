import { encodeStateToUrlParam } from '../encoding/urlEncoder';
import { DEFAULT_VISIBLE_COLUMNS, RESULTS_TABLE_COLUMNS, TEST_RUNS_QUERY_PARAMS } from './common';

export const DEFAULT_QUERY = {
  // The URL here is the filter state, not the browser URL
  url: `${encodeStateToUrlParam(
    `${TEST_RUNS_QUERY_PARAMS.TAB}=results&${TEST_RUNS_QUERY_PARAMS.QUERY_NAME}=Tests ran in the last 24 hours&${TEST_RUNS_QUERY_PARAMS.VISIBLE_COLUMNS}=${DEFAULT_VISIBLE_COLUMNS.sort().join(',')}&${TEST_RUNS_QUERY_PARAMS.COLUMNS_ORDER}=${RESULTS_TABLE_COLUMNS.sort()
      .map((col) => col.id)
      .join(',')}&${TEST_RUNS_QUERY_PARAMS.DURATION}=1,0,0`
  )}`,
  title: 'Tests ran in the last 24 hours',
  createdAt: new Date().toISOString(),
};
