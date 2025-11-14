/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import TestRunDetails from '@/components/test-runs/test-run-details/TestRunDetails';
import NotFound from '@/components/common/NotFound';
import ErrorPage from '@/app/error/page';
import { getTranslations } from 'next-intl/server';
import {
  fetchRunDetailLogs,
  fetchRunDetailsFromApiServer,
  fetchTestArtifacts,
} from '@/utils/testRuns';

// Define an interface for the component's props
interface TestRunProps {
  params: {
    slug: string;
  };
}

// Type the props directly on the function's parameter
export default async function TestRunPage({ params: { slug } }: TestRunProps) {
  const translations = await getTranslations('TestRunPage');
  // Check if run exists first
  try {
    await fetchRunDetailsFromApiServer(slug);
  } catch (error: any) {
    if (error?.code === 404) {
      return (
        <NotFound
          title={translations('notFoundTitle')}
          description={translations('notFoundDescription', { id: slug })}
        />
      );
    } else {
      return <ErrorPage />;
    }
  }

  return (
    <TestRunDetails
      runId={slug}
      runDetailsPromise={fetchRunDetailsFromApiServer(slug)}
      runArtifactsPromise={fetchTestArtifacts(slug)}
      runLogPromise={fetchRunDetailLogs(slug)}
    />
  );
}
