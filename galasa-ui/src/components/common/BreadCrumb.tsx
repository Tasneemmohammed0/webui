/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import React from 'react';
import { Breadcrumb, BreadcrumbItem, OverflowMenuItem, OverflowMenu, Theme } from '@carbon/react';
import '@/styles/global.scss';
import styles from '@/styles/common/BreadCrumb.module.css';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { BreadCrumbProps } from '@/utils/interfaces/components';
import { useRouter } from 'next/navigation';

// Update props to accept the reset function
interface CustomBreadCrumbProps {
  breadCrumbItems: BreadCrumbProps[];
}

function BreadCrumb({ breadCrumbItems }: CustomBreadCrumbProps) {
  const translations = useTranslations('Breadcrumb');
  const current = useTheme().theme;
  const router = useRouter();
  let theme: 'g10' | 'g90';

  const BREADCRUMB_THRESHOLD = 4;
  const NUM_START_ITEM = 2;
  const NUM_END_ITEM = 2;

  if (current === 'light') {
    theme = 'g10';
  } else if (current === 'dark') {
    theme = 'g90';
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'g90';
  } else {
    theme = 'g10';
  }

  const renderBreadCrumbItems = (items: BreadCrumbProps[]) => {
    return items.map((item) => {
      const translatedTitle = translations(item.title);
      const displayText = translatedTitle.startsWith('Breadcrumb.') ? item.title : translatedTitle;

      return (
        <BreadcrumbItem key={item.route} href={item.route}>
          {displayText}
        </BreadcrumbItem>
      );
    });
  };

  const renderOverflowItems = (items: BreadCrumbProps[]) => {
    return items.map((item) => {
      const translatedTitle = translations(item.title);
      const displayText = translatedTitle.startsWith('Breadcrumb.') ? item.title : translatedTitle;

      return (
        <OverflowMenuItem
          key={item.route}
          itemText={displayText}
          onClick={() => {
            router.push(item.route);
          }}
        />
      );
    });
  };

  return (
    <Theme theme={theme}>
      <Breadcrumb className={styles.crumbContainer}>
        {breadCrumbItems.length <= BREADCRUMB_THRESHOLD ? (
          renderBreadCrumbItems(breadCrumbItems)
        ) : (
          <>
            {/* Render the first 2 items */}
            {renderBreadCrumbItems(breadCrumbItems.slice(0, 2))}

            {/* Render the overflow menu with the middle terms */}
            <BreadcrumbItem>
              <OverflowMenu
                align="bottom"
                aria-label="More navigation links"
                data-testid="breadcrumb-overflow-menu"
              >
                {renderOverflowItems(breadCrumbItems.slice(NUM_START_ITEM, -NUM_END_ITEM))}
              </OverflowMenu>
            </BreadcrumbItem>

            {/* Render the last 2 items */}
            {renderBreadCrumbItems(breadCrumbItems.slice(-NUM_END_ITEM))}
          </>
        )}
      </Breadcrumb>
    </Theme>
  );
}

export default BreadCrumb;
