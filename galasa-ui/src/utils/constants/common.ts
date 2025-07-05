/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const CLIENT_API_VERSION = "0.43.0";

const COLORS = {

  RED: "#da1e28",
  GREEN: "#24A148",
  NEUTRAL: "#6f6f6f",
  BLUE: "#0043ce",
  YELLOW: "#f1c21b"

};

// Maximum number of records to fetch in one go
const MAX_RECORDS = 1000; 

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MAX_RANGE_MONTHS = 3;

const TEST_RUNS_STATUS = ['Submitted','Queued','Allocated', 'Started', 'Generating', 
  'Building', 'Provstart', 'Running', 'Rundone', 'Ending', 'Waiting', 'Finished',];

const COLUMNS_IDS = {
  SUBMITTED_AT: "submittedAt",
  TEST_RUN_NAME: "testRunName",
  REQUESTOR: "requestor",
  SUBMISSION_ID: "submissionId",
  GROUP: "group",
  BUNDLE: "bundle",
  PACKAGE: "package",
  TEST_NAME: "testName",
  STATUS: "status",
  TAGS: "tags",
  RESULT: "result"
} as const;

const RESULTS_TABLE_COLUMNS = [
  {id: "submittedAt", columnName: "Submitted at"},
  { id: "testRunName", columnName: "Test Run name" },
  { id: "requestor", columnName: "Requestor" },
  { id: "submissionId", columnName: "Submission ID" },
  { id: "group", columnName: "Group" },
  { id: "bundle", columnName: "Bundle" },
  { id: "package", columnName: "Package" },
  { id: "testName", columnName: "Test Name" },
  { id: "status", columnName: "Status" },
  { id: "tags", columnName: "Tags" },
  { id: "result", columnName: "Result" },
];
  
const PARAMS = {
  FROM: "from",
  TO: "to",
  RUN_NAME: "runName",
  REQUESTOR: "requestor",
  GROUP: "group",
  BUNDLE: "bundle",
  PACKAGE: "package",
  TEST_NAME: "testName",
  SUBMISSION_ID: "submissionId",
  STATUS: "status",
  RESULT: "result",
  TAGS: "tags",
  VISIBLE_COLUMNS: "visibleColumns",
  COLUMNS_ORDER: "columnsOrder",
  TAB: "tab"
};
  
const BATCH_SIZE = 100;

export { CLIENT_API_VERSION,COLORS, MAX_RECORDS, MINUTE_MS, 
  HOUR_MS, DAY_MS, MAX_RANGE_MONTHS, TEST_RUNS_STATUS,
  BATCH_SIZE, RESULTS_TABLE_COLUMNS, COLUMNS_IDS, PARAMS};
