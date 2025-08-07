/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {
  ArtifactIndexEntry,
  ResultArchiveStoreAPIApi,
  Run,
  RunResults,
  UserData,
} from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import {
  CLIENT_API_VERSION,
  MAX_DISPLAYABLE_TEST_RUNS,
  BATCH_SIZE,
} from '@/utils/constants/common';
import { fetchAllUsersFromApiServer } from '@/utils/users';

/**
 * The structure returned by the data fetching function.
 */
export interface TestRunsData {
  runs: Run[];
  limitExceeded: boolean;
}

interface fetchAllTestRunsByPagingParams {
  fromDate: Date;
  toDate: Date;
  runName?: string;
  requestor?: string;
  group?: string;
  submissionId?: string;
  bundle?: string;
  testName?: string;
  result?: string;
  status?: string;
  tags?: string;
}

/**
 * Internal helper function to get an initialized API client.
 */
const getRasApiClient = () => {
  const apiConfig = createAuthenticatedApiConfiguration();
  return new ResultArchiveStoreAPIApi(apiConfig);
};

/**
 * Fetches all test runs from the Result Archive Store API within a specified date range
 * by repeatedly calling the API until all runs are retrieved.
 *
 * @param {Date} fromDate - The start date for fetching runs.
 * @param {Date} toDate - The end date for fetching runs.
 * @param {string} [runName] - The name of the test run to filter by (optional).
 * @param {string} [requestor] - The requestor to filter by (optional).
 * @param {string} [group] - The group to filter by (optional).
 * @param {string} [submissionId] - The submission ID to filter by (optional).
 * @param {string} [bundle] - The bundle to filter by (optional).
 * @param {string} [testName] - The test name to filter by (optional).
 * @param {string} [result] - The result to filter by (optional).
 * @param {string} [tags] - The tags to filter by (optional).
 * @returns {Promise<TestRunsData>} - A promise that resolves to an object containing the runs and a flag indicating if the limit was reached.
 */
export const fetchAllTestRunsByPaging = async ({
  fromDate,
  toDate,
  runName,
  requestor,
  group,
  submissionId,
  bundle,
  testName,
  result,
  status,
  tags,
}: fetchAllTestRunsByPagingParams): Promise<TestRunsData> => {
  let allRuns = [] as Run[];
  let currentCursor: string | undefined = undefined;
  let hasMorePages = true;
  let limitExceeded = false;

  if (fromDate > toDate) return { runs: [], limitExceeded };

  const rasApiClient = getRasApiClient();

  try {
    while (hasMorePages && allRuns.length < MAX_DISPLAYABLE_TEST_RUNS) {
      // Fetch runs based on the provided date range
      const response: RunResults = await rasApiClient.getRasSearchRuns(
        'from:desc',
        CLIENT_API_VERSION,
        result,
        status,
        bundle,
        requestor,
        fromDate,
        toDate,
        testName,
        undefined, // page
        BATCH_SIZE,
        undefined, // runId
        runName,
        group,
        submissionId,
        undefined, // detail
        tags,
        'true', // includeCursor
        currentCursor
      );

      const runsInBatch = response.runs || [];
      if (runsInBatch.length > 0) {
        allRuns.push(...structuredClone(runsInBatch));
      }

      // Check if the limit was exceeded
      if (allRuns.length >= MAX_DISPLAYABLE_TEST_RUNS) {
        limitExceeded = true;

        // Trim to max records
        allRuns = allRuns.slice(0, MAX_DISPLAYABLE_TEST_RUNS);

        // Stop fetching more runs
        hasMorePages = false;
        break;
      }

      const nextCursor = response.nextCursor;
      // Check condition to stop looping
      if (!nextCursor || nextCursor === currentCursor || runsInBatch.length < BATCH_SIZE) {
        hasMorePages = false;
      } else {
        // Update cursor for next iteration
        currentCursor = nextCursor;
      }
    }
  } catch (error: any) {
    console.error('Error fetching test runs:', error);
  }

  return { runs: allRuns, limitExceeded };
};

/**
 * Fetches a list of requestor names from the API server.
 * @returns {Promise<string[]>} - A promise that resolves to an array of requestor names.
 */

export async function getRequestorList(): Promise<string[]> {
  try {
    const users: UserData[] = await fetchAllUsersFromApiServer();
    const requestorNames = users.map((user: UserData) => user.loginId);

    return requestorNames as string[];
  } catch (error) {
    console.error('Error fetching requestor list:', error);
    return [];
  }
}

/**
 * Fetches the names of results from the Result Archive Store API.
 *
 * @returns {Promise<string[]>} - A promise that resolves to an array of result names.
 */
export async function getResultsNames(): Promise<string[]> {
  const rasApiClient = getRasApiClient();

  try {
    const resultsNamesResponse = await rasApiClient.getRasResultNames(
      CLIENT_API_VERSION,
      'results:asc'
    );

    const resultsNames = resultsNamesResponse?.resultnames ?? [];
    return resultsNames;
  } catch (error) {
    console.error('Error fetching results names:', error);
    return [];
  }
}

export const fetchRunDetailsFromApiServer = async (slug: string) => {
  const rasApiClient = getRasApiClient();

  try {
    const rasRunsResponse = await rasApiClient.getRasRunById(slug);
    return structuredClone(rasRunsResponse);
  } catch (error: any) {
    console.error('Error fetching run details:', error);
    throw error;
  }
};

export const fetchRunDetailLogs = async (slug: string) => {
  const rasApiClient = getRasApiClient();

  const rasRunLogsResponse = await rasApiClient.getRasRunLog(slug);
  return rasRunLogsResponse;
};

export const fetchTestArtifacts = async (slug: string): Promise<ArtifactIndexEntry[]> => {
  let runArtifacts: ArtifactIndexEntry[] = [];

  const rasApiClient = getRasApiClient();

  const rasArtifactResponse = await rasApiClient.getRasRunArtifactList(slug);

  if (rasArtifactResponse) {
    runArtifacts = structuredClone(Array.from(rasArtifactResponse)); //Convert the set into array
  }

  return runArtifacts;
};
