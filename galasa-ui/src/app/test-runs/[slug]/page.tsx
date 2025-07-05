/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import TestRunDetails from '@/components/test-runs/TestRunDetails';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import { ArtifactIndexEntry, ResultArchiveStoreAPIApi} from '@/generated/galasaapi';
import NotFound from '@/components/common/NotFound';
import ErrorPage from '@/app/error/page';
import { getTranslations } from 'next-intl/server';

// Define an interface for the component's props
interface TestRunProps {
  params: {
    slug: string;
  };
}

// Type the props directly on the function's parameter
export default async function TestRunPage({ params: { slug } }: TestRunProps) {
  const translations = await getTranslations("TestRunPage");

  const apiConfig = createAuthenticatedApiConfiguration();
  const rasApiClient = new ResultArchiveStoreAPIApi(apiConfig);

  const fetchRunDetailsFromApiServer = async () => {
    try {
      const rasRunsResponse = await rasApiClient.getRasRunById(slug);
      return structuredClone(rasRunsResponse);
    } catch (error: any) {
      console.error("Error fetching run details:", error);
      throw error;
    }
  };

  const fetchRunDetailLogs = async () => {
    const rasRunLogsResponse = await rasApiClient.getRasRunLog(slug);
    return rasRunLogsResponse;
  };

  const fetchTestArtifacts = async (): Promise<ArtifactIndexEntry[]> => {
    let runArtifacts: ArtifactIndexEntry[] = [];

    const rasArtifactResponse = await rasApiClient.getRasRunArtifactList(slug);

    if (rasArtifactResponse) {
      runArtifacts = structuredClone(Array.from(rasArtifactResponse)); //Convert the set into array
    }

    return runArtifacts;
  };

  // Check if run exists first
  try {
    await fetchRunDetailsFromApiServer();
  } catch (error: any) {
    if (error?.code === 404) {
      return (
        <NotFound
          title={translations("notFoundTitle")}
          description={translations("notFoundDescription", { id: slug })}
        />
      );
    } else {
      return <ErrorPage />;
    }
  }

  return (
    <TestRunDetails 
      runId={slug} 
      runDetailsPromise={fetchRunDetailsFromApiServer()} 
      runArtifactsPromise={fetchTestArtifacts()} 
      runLogPromise={fetchRunDetailLogs()} 
    />
  );
};