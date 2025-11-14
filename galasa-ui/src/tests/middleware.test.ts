/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { middleware } from '@/middleware';
import { authApiClient } from '@/utils/auth';
import { encodeToBase64Url } from '@/utils/encoding/base64Encoder';
import { NextRequest, NextResponse } from 'next/server';

const originalEnv = process.env;

jest.mock('@/utils/auth', () => ({
  ...jest.requireActual('@/utils/auth'),
  GALASA_WEBUI_HOST_URL: 'http://mock-webui-host-url',
}));

// Mock the jwtDecode method
jest.mock('jwt-decode', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    exp: 50, // JWT expiry in seconds
  })),
}));

jest.mock('next/headers', () => ({
  ...jest.requireActual('next/headers'),
  cookies: jest.fn(() => ({
    get: jest.fn().mockReturnValue('false'),
  })),
}));

describe('Middleware', () => {
  let redirectSpy: jest.SpyInstance;
  let rewriteSpy: jest.SpyInstance;

  beforeEach(() => {
    redirectSpy = jest.spyOn(NextResponse, 'redirect').mockReturnValue(new NextResponse());
    rewriteSpy = jest.spyOn(NextResponse, 'rewrite');
    process.env = originalEnv;
  });

  afterEach(() => {
    redirectSpy.mockReset();
    rewriteSpy.mockReset();
  });

  it('should redirect to authenticate if the user does not have a JWT', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com/runs';
    const req = new NextRequest(new Request(requestUrl), {});
    const redirectUrl = 'http://my-connector/auth';

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          url: redirectUrl,
          headers: {
            get: jest.fn().mockReturnValue(redirectUrl),
          },
        })
      ) as jest.Mock
    );

    // When...
    await middleware(req);

    // Then...
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });

    // Fetch calls take the form 'fetch(<url>, <request-init>)', so get the URL that was passed in
    const fetchedUrl = fetchSpy.mock.calls[0][0];
    const expectedCallbackUrl = encodeToBase64Url('http://mock-webui-host-url/runs/callback');
    expect(fetchedUrl.toString()).toContain(`base64_callback_url=${expectedCallbackUrl}`);
    fetchSpy.mockRestore();
  });

  it('should send a callback URL to return to the correct page after authenticating', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(requestUrl), {});
    const redirectUrl = 'http://my-connector/auth';

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          url: redirectUrl,
          headers: {
            get: jest.fn().mockReturnValue(redirectUrl),
          },
        })
      ) as jest.Mock
    );

    // When...
    await middleware(req);

    // Then...
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });

    // Fetch calls take the form 'fetch(<url>, <request-init>)', so get the URL that was passed in
    const fetchedUrl = fetchSpy.mock.calls[0][0];
    const expectedCallbackUrl = encodeToBase64Url('http://mock-webui-host-url/callback');
    expect(fetchedUrl.toString()).toContain(`base64_callback_url=${expectedCallbackUrl}`);
    fetchSpy.mockRestore();
  });

  it('should send a callback URL with query parameters preserved after authenticating', async () => {
    // Given...
    const queryParams = 'myquery=1&myNextQuery=2';
    const requestUrl = `https://galasa.service/my-page?${queryParams}`;
    const req = new NextRequest(new Request(requestUrl), {});
    const redirectUrl = 'http://my-connector/auth';

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          url: redirectUrl,
          headers: {
            get: jest.fn().mockReturnValue(redirectUrl),
          },
        })
      ) as jest.Mock
    );

    // When...
    await middleware(req);

    // Then...
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });

    // Fetch calls take the form 'fetch(<url>, <request-init>)', so get the URL that was passed in
    const fetchedUrl = fetchSpy.mock.calls[0][0];
    const expectedCallbackUrl = encodeToBase64Url(
      `http://mock-webui-host-url/my-page/callback?${queryParams}`
    );
    expect(fetchedUrl.toString()).toContain(`base64_callback_url=${expectedCallbackUrl}`);
    fetchSpy.mockRestore();
  });

  it('should send a callback URL with query parameters encoded after authenticating', async () => {
    // Given...
    const query1Value = 'this:has:colons';
    const query2Value = 'this has spaces';

    const queryParams = new URLSearchParams({
      myquery: query1Value,
      mynextquery: query2Value,
    });

    const rawQueryParams = `myquery=${query1Value}&mynextquery=${query2Value}`;
    const requestUrl = `https://galasa.service/my-page?${rawQueryParams}`;
    const req = new NextRequest(new Request(requestUrl), {});
    const redirectUrl = 'http://my-connector/auth';

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          url: redirectUrl,
          headers: {
            get: jest.fn().mockReturnValue(redirectUrl),
          },
        })
      ) as jest.Mock
    );

    // When...
    await middleware(req);

    // Then...
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });

    // Fetch calls take the form 'fetch(<url>, <request-init>)', so get the URL that was passed in
    const fetchedUrl = fetchSpy.mock.calls[0][0];
    const expectedCallbackUrl = encodeToBase64Url(
      `http://mock-webui-host-url/my-page/callback?${queryParams.toString()}`
    );
    expect(fetchedUrl.toString()).toContain(`base64_callback_url=${expectedCallbackUrl}`);
    fetchSpy.mockRestore();
  });

  it('should redirect to authenticate if the issued JWT has expired in the past', async () => {
    // Given...
    const req = new NextRequest(new Request('https://galasa-ecosystem.com/runs'), {});
    req.cookies.set('id_token', 'valid-token');
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
        headers: {
          get: jest.fn().mockReturnValue(redirectUrl),
        },
      })
    ) as jest.Mock;

    // Mock JWTs have been set to expire after 50s, so let's set the current time to >50000ms
    Date.now = jest.fn(() => 68764);

    // When...
    await middleware(req);

    // Then...
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });
  });

  it('should redirect to authenticate if the issued JWT has expired exactly now', async () => {
    // Given...
    const req = new NextRequest(new Request('https://galasa-ecosystem.com/runs'), {});
    req.cookies.set('id_token', 'valid-token');

    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
        headers: {
          get: jest.fn().mockReturnValue(redirectUrl),
        },
      })
    ) as jest.Mock;

    // Mock JWTs have been set to expire after 50s, so let's set the current time to exactly 50000ms
    Date.now = jest.fn(() => 50000);

    // When...
    await middleware(req);

    // Then...
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith(redirectUrl, { status: 302 });
  });

  it('should not redirect a user to authenticate if they are authenticated with a valid JWT', async () => {
    // Given...
    const req = new NextRequest(new Request('https://galasa-ecosystem.com/runs'), {});
    req.cookies.set('id_token', 'valid-token');
    Date.now = jest.fn(() => 4324);

    // When...
    const response = await middleware(req);

    // Then...
    expect(redirectSpy).toHaveBeenCalledTimes(0);
    expect(response.status).toEqual(200);
  });

  it('should send a POST request to get a JWT during a callback to log in to the web UI', async () => {
    // Given...
    redirectSpy.mockRestore();

    const expectedResponseUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(`${expectedResponseUrl}/callback?code=myauthcode`), {});
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    const mockIdToken = 'mynewjwt';
    const createTokenSpy = jest.spyOn(authApiClient, 'createToken').mockReturnValue(
      Promise.resolve({
        jwt: mockIdToken,
        refreshToken: 'mynewrefreshtoken',
      })
    );

    // When...
    const response = await middleware(req);

    // Then...
    expect(createTokenSpy).toHaveBeenCalledTimes(1);
    expect(response.cookies.get('id_token')?.value).toEqual(mockIdToken);

    createTokenSpy.mockReset();
  });

  it('should set a refresh token cookie during a callback request with client ID cookie', async () => {
    // Given...
    redirectSpy.mockRestore();

    const expectedResponseUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(`${expectedResponseUrl}/callback?code=myauthcode`), {});
    const redirectUrl = 'http://my-connector/auth';

    req.cookies.set('client_id', 'my-client-id');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    const mockRefreshToken = 'mynewrefreshtoken';
    const createTokenSpy = jest.spyOn(authApiClient, 'createToken').mockReturnValue(
      Promise.resolve({
        jwt: 'mynewjwt',
        refreshToken: mockRefreshToken,
      })
    );

    // When...
    const response = await middleware(req);

    // Then...
    expect(createTokenSpy).toHaveBeenCalledTimes(1);
    expect(response.cookies.get('refresh_token')?.value).toEqual(mockRefreshToken);
    expect(response.cookies.has('id_token')).toEqual(false);

    createTokenSpy.mockReset();
  });

  it('should redirect back to the web UI with query parameters preserved', async () => {
    // Given...
    redirectSpy.mockRestore();

    const expectedResponseUrl = 'https://galasa.service/mypage';
    const queryParams = 'myquery=1&mynextquery=2';
    const req = new NextRequest(
      new Request(`${expectedResponseUrl}/callback?code=myauthcode&${queryParams}`),
      {}
    );
    const redirectUrl = 'http://my-connector/auth';

    req.cookies.set('client_id', 'my-client-id');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    const mockRefreshToken = 'mynewrefreshtoken';
    const createTokenSpy = jest.spyOn(authApiClient, 'createToken').mockReturnValue(
      Promise.resolve({
        jwt: 'mynewjwt',
        refreshToken: mockRefreshToken,
      })
    );

    // When...
    const response = await middleware(req);

    // Then...
    expect(response.status).toEqual(302);
    expect(response.headers.get('Location')).toEqual(`${expectedResponseUrl}?${queryParams}`);

    createTokenSpy.mockReset();
  });

  it('should issue a rewrite to the error page if something goes wrong during the authentication process', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(requestUrl), {});

    global.fetch = jest.fn(() => Promise.reject('this is an error!')) as jest.Mock;

    // When...
    await middleware(req);

    // Then...
    expect(rewriteSpy).toHaveBeenCalledTimes(1);
    expect(rewriteSpy).toHaveBeenCalledWith(new URL('/error', requestUrl));
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('should issue a rewrite to the error page if the authentication request does not contain a location header', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(requestUrl), {});

    global.fetch = jest.fn(() =>
      Promise.resolve({
        headers: {
          get: jest.fn(),
        },
      })
    ) as jest.Mock;

    // When...
    await middleware(req);

    // Then...
    expect(rewriteSpy).toHaveBeenCalledTimes(1);
    expect(rewriteSpy).toHaveBeenCalledWith(new URL('/error', requestUrl));
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('should authenticate with the provided dev token when the webui is running in development mode', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(requestUrl), {});

    process.env = {
      ...originalEnv,
      GALASA_DEV_TOKEN: 'galasa:token',
      NODE_ENV: 'development',
    };

    const mockIdToken = 'mynewjwt';
    const postAuthenticateSpy = jest.spyOn(authApiClient, 'postAuthenticate').mockReturnValue(
      Promise.resolve({
        jwt: mockIdToken,
        refreshToken: 'myrefreshtoken',
      })
    );

    // When...
    const response = await middleware(req);

    // Then...
    expect(redirectSpy).toHaveBeenCalledTimes(0);
    expect(postAuthenticateSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toEqual(200);
    expect(response.headers.get('Set-Cookie')).toEqual(`id_token=${mockIdToken}`);

    postAuthenticateSpy.mockReset();
  });

  it('should issue a rewrite to the error page when the provided dev token is invalid', async () => {
    // Given...
    const requestUrl = 'https://galasa-ecosystem.com';
    const req = new NextRequest(new Request(requestUrl), {});

    process.env = {
      ...originalEnv,
      GALASA_DEV_TOKEN: 'invalidtoken',
      NODE_ENV: 'development',
    };

    // When...
    await middleware(req);

    // Then...
    expect(rewriteSpy).toHaveBeenCalledTimes(1);
    expect(rewriteSpy).toHaveBeenCalledWith(new URL('/error', requestUrl));
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it('should not reauthenticate a user in development mode if they have a valid JWT', async () => {
    // Given...
    const req = new NextRequest(new Request('https://galasa-ecosystem.com/runs'), {});
    req.cookies.set('id_token', 'valid-token');
    Date.now = jest.fn(() => 4324);

    process.env = {
      ...originalEnv,
      GALASA_DEV_TOKEN: 'galasa:token',
      NODE_ENV: 'development',
    };

    const postAuthenticateSpy = jest.spyOn(authApiClient, 'postAuthenticate');

    // When...
    const response = await middleware(req);

    // Then...
    expect(postAuthenticateSpy).not.toHaveBeenCalled();
    expect(response.status).toEqual(200);

    postAuthenticateSpy.mockReset();
  });
});
