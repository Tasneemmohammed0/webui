/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { encodeStateToUrlParam, decodeStateFromUrlParam } from '@/utils/encoding/urlEncoder';

describe('URL State Encoder/Decoder', () => {
  test('should correctly encode a query string and decode it back', () => {
    const queryString = 'from=2023-01-01&to=2023-01-31&status=failed,passed';

    const encoded = encodeStateToUrlParam(queryString);

    // The encoded string should not be the same as the original
    expect(encoded).not.toBe(queryString);
    expect(typeof encoded).toBe('string');

    const decoded = decodeStateFromUrlParam(encoded);

    const originalParams = new URLSearchParams(queryString);
    const decodedParams = new URLSearchParams(decoded || '');

    // The final decoded string should match the original
    expect(decodedParams.get('status')).toBe(originalParams.get('status'));
    const originalFromDate = new Date(originalParams.get('from')!).toISOString().split('T')[0];
    const decodedFromDate = new Date(decodedParams.get('from')!).toISOString().split('T')[0];
    expect(decodedFromDate).toBe(originalFromDate);

    const originalToDate = new Date(originalParams.get('to')!).toISOString().split('T')[0];
    const decodedToDate = new Date(decodedParams.get('to')!).toISOString().split('T')[0];
    expect(decodedToDate).toBe(originalToDate);
  });

  test('should handle empty strings correctly', () => {
    expect(encodeStateToUrlParam('')).toBe('');
    expect(decodeStateFromUrlParam('')).toBeNull();
    expect(decodeStateFromUrlParam(null as any)).toBeNull();
  });

  test('should return null when decoding an invalid Base64 string', () => {
    const invalidBase64 = 'this-is-not-base64-%';
    const result = decodeStateFromUrlParam(invalidBase64);
    expect(result).toBeNull();
  });
});
