/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {fetchAllTestRunsByPaging} from "@/utils/testRuns";
import { getYesterday } from '@/utils/timeOperations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const params = {
        fromDate: searchParams.has('from') ? new Date(searchParams.get('from')!) : getYesterday(),
        toDate: searchParams.has('to') ? new Date(searchParams.get('to')!) : new Date(),
        runName: searchParams.get('runName') || undefined,
        requestor: searchParams.get('requestor') || undefined,
        group: searchParams.get('group') || undefined,
        submissionId: searchParams.get('submissionId') || undefined,
        bundle: searchParams.get('bundle') || undefined,
        testName: searchParams.get('testName') || undefined,
        result: searchParams.get('result') || undefined,
        status: searchParams.get('status') || undefined,
        tags: searchParams.get('tags') || undefined,
    };

    try {
        const data = await fetchAllTestRunsByPaging(params);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching test runs:", error);
        return NextResponse.json({ error: "Failed to fetch test runs" }, { status: 500 });
    }
}