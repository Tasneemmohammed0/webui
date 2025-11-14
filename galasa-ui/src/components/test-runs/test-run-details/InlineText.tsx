/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import styles from '@/styles/test-runs/test-run-details/InlineText.module.css';

const InlineText = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className={styles.info}>
      <p>{title}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
};

export default InlineText;
