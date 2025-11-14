/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { DataPoint } from './interfaces';
import styles from '@/styles/test-runs/graph/TestRunsGraph.module.css';

export function getTooltipHTML(
  points: DataPoint[],
  headerDefinitions: { key: string; header: string }[],
  formatDate = (date: Date) => new Date(date).toLocaleString()
) {
  const run = points[0]?.custom || {};

  return `
    <div class="${styles.tooltipContent}">
      ${headerDefinitions
        .map(({ key, header }) => {
          let value = run[key as keyof typeof run];
          if (key === 'submittedAt') {
            value = formatDate(new Date(value));
          }

          return `<strong>${header}:</strong> ${value ?? 'Unknown'}`;
        })
        .join('<br/>')}
    </div>`;
}
