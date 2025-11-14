/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { encodeToBase64, encodeToBase64Url } from '@/utils/encoding/base64Encoder';

describe('Base64 Encoder tests', () => {
  it('should correctly encode a string into Base64 format', () => {
    // Given...
    const rawString = 'my string';
    const expectedString = 'bXkgc3RyaW5n';

    // When...
    const encodedString = encodeToBase64(rawString);

    // Then...
    expect(encodedString).toEqual(expectedString);
  });

  it('should correctly encode a string into Base64URL format', () => {
    // Given...
    const rawString = '<<my special string!>>';
    const expectedBase64String = 'PDxteSBzcGVjaWFsIHN0cmluZyE+Pg==';

    // Base64 URL encoding replaces '+' with '-', '=' with '', and '/' with '_'
    const expectedUrlString = 'PDxteSBzcGVjaWFsIHN0cmluZyE-Pg';

    // When...
    const encodedString = encodeToBase64(rawString);
    const encodedUrlString = encodeToBase64Url(rawString);

    // Then...
    expect(encodedString).toEqual(expectedBase64String);
    expect(encodedUrlString).toEqual(expectedUrlString);
  });
});
