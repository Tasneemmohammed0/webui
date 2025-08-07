/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { AmPm } from '../types/common';

/**
 * Interfaces related to test runs, filtering, and time-based operations
 */

export interface RunMetadata {
  runId: string;
  result: string;
  status: string;
  testName: string;
  testShortName: string;
  runName: string;
  bundle: string;
  submissionId: string;
  package: string;
  group: string;
  requestor: string;
  rawSubmittedAt?: string;
  submitted: string;
  startedAt: string;
  finishedAt: string;
  duration: string;
  tags: string[];
}

export interface TimeFrameValues {
  fromDate: Date;
  fromTime: string;
  fromAmPm: AmPm;
  toDate: Date;
  toTime: string;
  toAmPm: AmPm;
  durationDays: number;
  durationHours: number;
  durationMinutes: number;
}

export interface RunLog {
  content: string;
  route: string;
}
