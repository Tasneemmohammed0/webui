/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { runStructure } from '@/utils/interfaces';

/**
 * Generate a time frame text based on the runs data.
 * @param runsList - The list of test runs.
 * @param isRelativeToNow - Whether the time frame is relative to now.
 * @param durationDays - The duration in days.
 * @param durationHours - The duration in hours.
 * @param durationMinutes - The duration in minutes.
 * @param translations - The translation function.
 *
 * @returns The generated time frame text.
 */
export const getTimeframeText = (
  runsList: runStructure[],
  translations: any,
  formatDate: (date: Date) => string
): string => {
  if (!runsList || runsList.length === 0) {
    return translations('noTestRunsFound');
  }

  let text = translations('timeFrameText.default');

  // Filter out any runs that don't have a valid `submittedAt` date
  const runsWithDates = runsList.filter((run) => run.submittedAt);

  if (runsWithDates.length !== 0) {
    const dates = runsWithDates.map((run) => new Date(run.submittedAt).getTime());
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    if (earliestDate && latestDate) {
      text = translations('timeFrameText.range', {
        from: formatDate(earliestDate),
        to: formatDate(latestDate),
      });
    }
  }

  return text;
};
