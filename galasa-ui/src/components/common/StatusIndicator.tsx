/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import {
  CheckmarkFilled,
  ErrorFilled,
  Help,
  Renew,
  StopFilled,
  WarningFilled,
} from '@carbon/icons-react';

import styles from '@/styles/common/StatusIndicator.module.css';
import React from 'react';

interface StatusIndicatorProps {
  status: string;
}

/**
 * StatusIndicator component displays an icon and text for the status of a test run.
 *
 * @param status - The status of the test run, which can be 'passed', 'failed', 'envfail', etc.
 * @returns A component with a status icon and formatted text, aligned and spaced correctly.
 */
export default function StatusIndicator({ status }: StatusIndicatorProps) {
  let IconComponent: React.ElementType = Help;
  let iconClassName = styles.statusOther;

  // Determine the correct icon and class based on the status
  switch (status?.toLowerCase().trim()) {
    case 'passed':
      IconComponent = CheckmarkFilled;
      iconClassName = styles.statusPassed;
      break;

    case 'failed':
    case 'envfail':
      IconComponent = ErrorFilled;
      iconClassName = styles.statusFailed;
      break;

    case 'requeued':
      IconComponent = Renew;
      iconClassName = styles.statusRequeued;
      break;

    case 'cancelled':
    case 'ignored':
      IconComponent = StopFilled;
      iconClassName = styles.statusCancelled;
      break;

    case 'hung':
      IconComponent = WarningFilled;
      iconClassName = styles.statusHung;
      break;
  }

  // Capitalize the first letter for display
  let displayText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  displayText = displayText.trim();

  // Render a container with the icon and text inside
  return (
    <div className={styles.statusContainer}>
      <IconComponent className={iconClassName} aria-label={displayText} />
      <span>{displayText}</span>
    </div>
  );
}
