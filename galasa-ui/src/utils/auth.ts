/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { AuthenticationAPIApi } from '@/generated/galasaapi';
import { createApiConfiguration, GALASA_API_SERVER_URL } from './api';
import { encodeToBase64Url } from '@/utils/encoding/base64Encoder';

export const GALASA_WEBUI_HOST_URL = process.env.GALASA_WEBUI_HOST_URL ?? '';

export const GALASA_WEBUI_CLIENT_ID = process.env.GALASA_WEBUI_CLIENT_ID ?? 'galasa-webui';

// Initialise an auth API client
export const authApiClient = new AuthenticationAPIApi(
  createApiConfiguration(GALASA_API_SERVER_URL)
);

/**
 * Sends a request to initiate an authentication flow and returns the response.
 * Note: The OpenAPI-generated code doesn't support redirects, so this method is being used instead.
 * @param clientId the ID of the Dex client to authenticate with
 * @returns the response of the /auth request
 */
export const sendAuthRequest = async (
  clientId: string,
  clientCallbackUrl = `${GALASA_WEBUI_HOST_URL}/callback`
) => {
  const encodedCallbackUrl = encodeToBase64Url(clientCallbackUrl);
  const authRequestUrl = `/auth?client_id=${clientId}&base64_callback_url=${encodedCallbackUrl}`;

  return await fetch(new URL(authRequestUrl, GALASA_API_SERVER_URL), {
    redirect: 'manual',
  });
};
