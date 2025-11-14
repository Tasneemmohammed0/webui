/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { getRequestorList, getResultsNames } from '@/utils/testRuns';
import TestRunsDetails from '@/components/test-runs/TestRunsDetails';

export default async function TestRunsPage() {
  const requestorNamesPromise = getRequestorList();
  const resultsNamesPromise = getResultsNames();

  return (
    <main id="content">
      <TestRunsDetails
        requestorNamesPromise={requestorNamesPromise}
        resultsNamesPromise={resultsNamesPromise}
      />
    </main>
  );
}
