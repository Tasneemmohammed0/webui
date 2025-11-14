/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import styles from '@/styles/mysettings/DateTimeSettings.module.css';
import { useTranslations } from 'next-intl';
import FormatSection from './FormatSection';
import TimezoneSection from './TimezoneSection';

export default function DateTimeSettings() {
  const translations = useTranslations('DateTimeSettings');
  return (
    <section className={styles.section}>
      <h3>{translations('title')}</h3>
      <FormatSection />
      <br />
      <TimezoneSection />
    </section>
  );
}
