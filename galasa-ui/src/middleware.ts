/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { NextResponse, NextRequest } from 'next/server';
import AuthCookies from './utils/authCookies';
import {
  GALASA_WEBUI_CLIENT_ID,
  GALASA_WEBUI_HOST_URL,
  authApiClient,
  sendAuthRequest,
} from './utils/auth';
import { AuthProperties } from './generated/galasaapi';
import { cookies } from 'next/headers';
import { CLIENT_API_VERSION } from './utils/constants/common';
import { NextURL } from 'next/dist/server/web/next-url';

const authenticateWithDevToken = async (devToken: string) => {
  let response = NextResponse.next();
  const authProperties = new AuthProperties();

  // Access tokens are expected to be in the form "<refresh-token>:<client-id>"
  const devTokenParts = devToken.split(':');
  if (devTokenParts.length == 2) {
    const refreshToken = devTokenParts[0];
    const clientId = devTokenParts[1];

    authProperties.refreshToken = refreshToken;
    authProperties.clientId = clientId;

    const { jwt } = await authApiClient.postAuthenticate(authProperties, CLIENT_API_VERSION);
    if (jwt && !isTokenExpired(jwt)) {
      response.headers.set('Set-Cookie', `${AuthCookies.ID_TOKEN}=${jwt}`);
    }
  } else {
    throw new Error('Invalid Galasa token provided.');
  }
  return response;
};

// Runs before any request is completed
export async function middleware(request: NextRequest) {
  const requestUrl = request.nextUrl;
  let response = NextResponse.rewrite(new URL('/error', requestUrl.toString()));

  try {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.GALASA_DEV_TOKEN &&
      !isAuthenticated(request)
    ) {
      response = await authenticateWithDevToken(process.env.GALASA_DEV_TOKEN);
    } else {
      if (requestUrl.pathname.includes('/callback')) {
        const responseUrl = buildRedirectBackToWebUiUrl(requestUrl);

        response = await handleCallback(
          request,
          NextResponse.redirect(responseUrl, { status: 302 })
        );
      } else if (!isAuthenticated(request)) {
        // Force the user to re-authenticate, getting the URL to redirect to and any cookies to be set
        const callbackUrl = getRequestCallbackUrl(requestUrl);
        const authResponse = await sendAuthRequest(GALASA_WEBUI_CLIENT_ID, callbackUrl);
        const locationHeader = authResponse.headers.get('Location');
        if (locationHeader) {
          response = NextResponse.redirect(locationHeader, { status: 302 });
          response.headers.set('Set-Cookie', authResponse.headers.get('Set-Cookie') ?? '');
        }
      } else {
        // User is authenticated and the request can go through
        response = NextResponse.next();
      }
    }
  } catch (err) {
    console.error('Failed to authenticate with the Galasa Ecosystem: %s', err);
  }
  return response;
}

// Returns a string representing the URL to return back to after authenticating.
const getRequestCallbackUrl = (nextUrl: NextURL) => {
  // Remove the trailing '/' from the host URL and requested path if there is one
  let hostUrl = GALASA_WEBUI_HOST_URL;
  if (hostUrl.endsWith('/')) {
    hostUrl = hostUrl.substring(0, hostUrl.length - 1);
  }

  let pathName = nextUrl.pathname;
  if (pathName === '/') {
    pathName = '';
  } else if (pathName.endsWith('/')) {
    pathName = pathName.substring(0, pathName.length - 1);
  }

  // Build up the URL-encoded query parameters
  const queryParamsString = nextUrl.searchParams.toString();
  const callbackQuery = queryParamsString ? `?${queryParamsString}` : '';

  // The request path is expected to start with a '/' if a non-root path is requested
  const callbackUrl = `${hostUrl}${pathName}/callback${callbackQuery}`;
  return callbackUrl;
};

const buildRedirectBackToWebUiUrl = (requestUrl: NextURL) => {
  const requestUrlString = requestUrl.toString();
  let responseUrl = requestUrlString.substring(0, requestUrlString.lastIndexOf('/callback'));

  const shouldReturnToMySettingsPage = cookies().get(AuthCookies.SHOULD_REDIRECT_TO_SETTINGS);
  if (shouldReturnToMySettingsPage?.value === 'true') {
    responseUrl += '/mysettings';
  }

  // The OAuth process returns a 'code' query parameter for clients to exchange this for a JWT
  // We don't need to keep this around after the OAuth process is complete, so we delete it here
  const queryParams = new URLSearchParams(requestUrl.searchParams);
  queryParams.delete('code');

  const queryParamsString = queryParams.toString();
  const urlQuery = queryParamsString ? `?${queryParamsString}` : '';

  responseUrl += urlQuery;
  return responseUrl;
};

// Checks if a cookie containing a JWT exists, redirecting users to authenticate
// if a JWT does not exit or if the existing token has expired.
const isAuthenticated = (request: NextRequest) => {
  const idToken = request.cookies.get(AuthCookies.ID_TOKEN);
  let isAuthenticated = false;
  if (idToken) {
    if (!isTokenExpired(idToken.value)) {
      isAuthenticated = true;
    }
  }
  return isAuthenticated;
};

// Checks whether a given JWT is expired, returning true if so, and false otherwise.
const isTokenExpired = (jwt: string) => {
  let isExpired = true;

  try {
    const decodedJwt = jwtDecode(jwt) as JwtPayload;
    const jwtExpiry = decodedJwt.exp;

    if (jwtExpiry) {
      const currentTimeEpochMilliseconds = Date.now();

      // A JWT's expiry time is a Unix timestamp (number of seconds since the Unix Epoch),
      // so the format of the current time must match to calculate the correct difference.
      isExpired = jwtExpiry * 1000 - currentTimeEpochMilliseconds <= 0;
    }
  } catch (err) {
    // Do nothing - the JWT is invalid, so it will be marked as expired to force re-authentication.
  }
  return isExpired;
};

// Handler for any callback request. This allows any page on the webui to have a callback route,
// so if a user needs to re-authenticate, they can do so and then be returned to the page that
// they were originally looking at.
const handleCallback = async (request: NextRequest, response: NextResponse) => {
  const queryParams = request.nextUrl.searchParams;
  const code = queryParams.get('code');

  if (code) {
    let clientId = '';
    const clientIdCookie = request.cookies.get(AuthCookies.CLIENT_ID);

    if (!clientIdCookie) {
      clientId = process.env.GALASA_WEBUI_CLIENT_ID ?? '';
    } else {
      clientId = clientIdCookie.value;
    }

    const tokenDescription = request.cookies.get(AuthCookies.TOKEN_DESCRIPTION)?.value;
    response.cookies.delete(AuthCookies.TOKEN_DESCRIPTION);

    // Build the request body
    const authProperties = buildAuthProperties(clientId, code, tokenDescription);

    // Send a POST request to the API server's /auth endpoint to exchange the authorization code with a JWT
    const tokenResponse = await authApiClient.createToken(authProperties);

    if (tokenResponse.jwt && !clientIdCookie) {
      response.cookies.set(AuthCookies.ID_TOKEN, tokenResponse.jwt, {
        httpOnly: true,
      });
    } else if (tokenResponse.refreshToken && clientIdCookie) {
      response.cookies.set(AuthCookies.REFRESH_TOKEN, tokenResponse.refreshToken, {
        httpOnly: true,
      });
    }
  }
  return response;
};

const buildAuthProperties = (clientId: string, code: string, tokenDescription?: string) => {
  const authProperties = new AuthProperties();

  authProperties.clientId = clientId;
  authProperties.code = code;
  authProperties.description = tokenDescription;

  return authProperties;
};

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // /error
    // /_next/static (static files)
    // /_next/image (image optimisations)
    // /favicon.ico
    '/((?!error|_next/static|_next/image|favicon.ico).*)',
  ],
};
