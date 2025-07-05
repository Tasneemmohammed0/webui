/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { PARAMS } from "@/utils/constants/common";
import {fetchAllTestRunsByPaging} from "@/utils/testRuns";
import { getYesterday } from '@/utils/timeOperations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params = {
    fromDate: searchParams.has(PARAMS.FROM) ? new Date(searchParams.get('from')!) : getYesterday(),
    toDate: searchParams.has(PARAMS.TO) ? new Date(searchParams.get('to')!) : new Date(),
    runName: searchParams.get(PARAMS.RUN_NAME) || undefined,
    requestor: searchParams.get(PARAMS.REQUESTOR) || undefined,
    group: searchParams.get(PARAMS.GROUP) || undefined,
    submissionId: searchParams.get(PARAMS.SUBMISSION_ID) || undefined,
    bundle: searchParams.get(PARAMS.BUNDLE) || undefined,
    testName: searchParams.get(PARAMS.TEST_NAME) || undefined,
    result: searchParams.get(PARAMS.RESULT) || undefined,
    status: searchParams.get(PARAMS.STATUS) || undefined,
    tags: searchParams.get(PARAMS.TAGS) || undefined,
  };

  try {
    const data = await fetchAllTestRunsByPaging(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching test runs:", error);
    return NextResponse.json({ error: "Failed to fetch test runs" }, { status: 500 });
  }
}