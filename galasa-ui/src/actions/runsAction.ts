/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use server';

import { ResultArchiveStoreAPIApi } from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import { CLIENT_API_VERSION } from '@/utils/constants/common';

export const downloadArtifactFromServer = async (runId: string, artifactUrl: string) => {
  const apiConfig = createAuthenticatedApiConfiguration();
  const rasApiClient = new ResultArchiveStoreAPIApi(apiConfig);

  const artifactFile = await rasApiClient.getRasRunArtifactByPath(
    runId,
    artifactUrl,
    CLIENT_API_VERSION
  );
  const contentType = artifactFile.type;

  const arrayBuffer = await artifactFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const size = artifactFile.size;

  const base64 = buffer.toString('base64');

  let data: string;

  if (contentType.includes('application/json')) {
    // buffer.toString('utf-8') converts the raw bytes into a JSON string
    const utf8String = buffer.toString('utf-8');
    try {
      data = JSON.parse(utf8String);
    } catch (e) {
      // If parsing fails, just return the raw string under data
      data = utf8String;
    }
  } else {
    // Otherwise, treat it as plain text (or any other mime) and return the UTF-8 string
    data = buffer.toString('utf-8');
  }

  return {
    contentType,
    data,
    size,
    base64,
  };
};
