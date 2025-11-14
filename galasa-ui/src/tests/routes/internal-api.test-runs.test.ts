/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { GET } from '@/app/internal-api/test-runs/route';
import { fetchAllTestRunsByPaging } from '@/utils/testRuns';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '@/utils/constants/common';
import { getYesterday } from '@/utils/timeOperations';
import { NextRequest } from 'next/server';

jest.mock('@/utils/testRuns', () => ({
  fetchAllTestRunsByPaging: jest.fn(),
}));

jest.mock('@/utils/timeOperations', () => ({
  getYesterday: jest.fn(),
}));

const mockFetchAllTestRunsByPaging = fetchAllTestRunsByPaging as jest.Mock;
const mockGetYesterday = getYesterday as jest.Mock;

jest.mock('next/server', () => {
  const original = jest.requireActual('next/server');
  return {
    ...original,
    NextResponse: {
      json: (data: any, init?: any) =>
        new Response(JSON.stringify(data), {
          status: init?.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    },
  };
});

describe('GET /internal-api/test-runs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetYesterday.mockReturnValue(new Date('2023-10-01T00:00:00Z'));
  });

  test('calls fetchAllTestRunsByPaging with duration-based filtering', async () => {
    const fakeNow = new Date('2023-10-05T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => fakeNow as any);

    const request = new NextRequest(`http://localhost/internal-api/test-runs?duration=1,2,30`);

    mockFetchAllTestRunsByPaging.mockResolvedValue([{ id: 'test1' }]);

    const response = await GET(request);
    const body = await response.json();

    // Expected fromDate = now - (1d + 2h + 30m)
    const expectedFrom = new Date(fakeNow.getTime() - (1 * DAY_MS + 2 * HOUR_MS + 30 * MINUTE_MS));

    expect(mockFetchAllTestRunsByPaging).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: expectedFrom,
        toDate: fakeNow,
      })
    );
    expect(body).toEqual([{ id: 'test1' }]);
  });

  test('calls fetchAllTestRunsByPaging with from/to params', async () => {
    const request = new NextRequest(
      `http://localhost/internal-api/test-runs?from=2023-09-01T00:00:00Z&to=2023-09-02T00:00:00Z`
    );

    mockFetchAllTestRunsByPaging.mockResolvedValue([{ id: 'test2' }]);

    const response = await GET(request);
    const body = await response.json();

    expect(mockFetchAllTestRunsByPaging).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: new Date('2023-09-01T00:00:00Z'),
        toDate: new Date('2023-09-02T00:00:00Z'),
      })
    );
    expect(body).toEqual([{ id: 'test2' }]);
  });

  test('uses yesterday and today when no duration or from/to provided', async () => {
    const fakeNow = new Date('2023-10-05T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => fakeNow as any);

    const request = new NextRequest(`http://localhost/internal-api/test-runs`);

    mockFetchAllTestRunsByPaging.mockResolvedValue([{ id: 'default' }]);

    const response = await GET(request);
    const body = await response.json();

    expect(mockFetchAllTestRunsByPaging).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: new Date('2023-10-01T00:00:00Z'), // mocked getYesterday
        toDate: fakeNow,
      })
    );
    expect(body).toEqual([{ id: 'default' }]);
  });

  test('returns 500 on fetchAllTestRunsByPaging error', async () => {
    const request = new NextRequest(`http://localhost/internal-api/test-runs`);
    mockFetchAllTestRunsByPaging.mockRejectedValue(new Error('Failed to fetch'));

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch test runs' });
  });
});
