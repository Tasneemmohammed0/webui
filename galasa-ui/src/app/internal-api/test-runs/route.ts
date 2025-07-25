/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { TEST_RUNS_QUERY_PARAMS } from "@/utils/constants/common";
import {fetchAllTestRunsByPaging} from "@/utils/testRuns";
import { getYesterday } from '@/utils/timeOperations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params = {
    fromDate: searchParams.has(TEST_RUNS_QUERY_PARAMS.FROM) ? new Date(searchParams.get('from')!) : getYesterday(),
    toDate: searchParams.has(TEST_RUNS_QUERY_PARAMS.TO) ? new Date(searchParams.get('to')!) : new Date(),
    runName: searchParams.get(TEST_RUNS_QUERY_PARAMS.RUN_NAME) || undefined,
    requestor: searchParams.get(TEST_RUNS_QUERY_PARAMS.REQUESTOR) || undefined,
    group: searchParams.get(TEST_RUNS_QUERY_PARAMS.GROUP) || undefined,
    submissionId: searchParams.get(TEST_RUNS_QUERY_PARAMS.SUBMISSION_ID) || undefined,
    bundle: searchParams.get(TEST_RUNS_QUERY_PARAMS.BUNDLE) || undefined,
    testName: searchParams.get(TEST_RUNS_QUERY_PARAMS.TEST_NAME) || undefined,
    result: searchParams.get(TEST_RUNS_QUERY_PARAMS.RESULT) || undefined,
    status: searchParams.get(TEST_RUNS_QUERY_PARAMS.STATUS) || undefined,
    tags: searchParams.get(TEST_RUNS_QUERY_PARAMS.TAGS) || undefined,
  };

  try {
    const data = await fetchAllTestRunsByPaging(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching test runs:", error);
    return NextResponse.json({ error: "Failed to fetch test runs" }, { status: 500 });
  }
}