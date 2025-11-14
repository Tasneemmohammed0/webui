/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {
  compressToEncodedURIComponent as compress,
  decompressFromEncodedURIComponent as decompress,
} from 'lz-string';
import { minifyState, expandState } from './urlStateMappers';

function paramsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function objectToParams(obj: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();
  for (const key in obj) {
    // Ensure we only add keys that have a non-undefined value
    if (obj[key] !== undefined) {
      params.set(key, obj[key]);
    }
  }
  return params;
}

/**
 * Compresses a query string into a highly compact, URL-safe string.
 */
export function encodeStateToUrlParam(queryString: string): string {
  if (!queryString) {
    return '';
  }
  try {
    const params = new URLSearchParams(queryString);
    const paramObject = paramsToObject(params);

    // T minify the object before doing anything else
    const minifiedObject = minifyState(paramObject);
    if (Object.keys(minifiedObject).length === 0) {
      return '';
    }

    const jsonString = JSON.stringify(minifiedObject);
    return compress(jsonString);
  } catch (error) {
    console.error('Failed to encode URL state:', error);
    return '';
  }
}

/**
 * Decodes a compact, URL-safe string and decompresses it back to the original query string.
 */
export function decodeStateFromUrlParam(encodedParam: string): string | null {
  if (!encodedParam) {
    return null;
  }
  try {
    const decompressedJson = decompress(encodedParam);
    if (decompressedJson) {
      const minifiedObject = JSON.parse(decompressedJson);

      // expand the object to restore the full state
      const expandedObject = expandState(minifiedObject);

      return objectToParams(expandedObject).toString();
    }
    return null;
  } catch (error) {
    console.error('Failed to decode URL state:', error);
    return null;
  }
}
