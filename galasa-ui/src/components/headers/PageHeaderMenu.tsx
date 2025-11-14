/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import React, { useEffect } from 'react';
import { HeaderGlobalBar, OverflowMenu, OverflowMenuItem, HeaderName } from '@carbon/react';
import { User } from '@carbon/icons-react';
import { useRouter } from 'next/navigation';
import { handleDeleteCookieApiOperation } from '@/utils/logout';
import LanguageSelector from './LanguageSelector';
import { useTranslations } from 'next-intl';
import ThemeSelector from './ThemeSelector';

function PageHeaderMenu({ galasaServiceName }: { galasaServiceName: string }) {
  const translations = useTranslations('PageHeaderMenu');

  const router = useRouter();

  const handleRedirectToMyProfilePage = () => {
    router.push('/myprofile');
  };

  const handleRedirectToMySettingsPage = () => {
    router.push('/mysettings');
  };

  return (
    <HeaderGlobalBar data-testid="header-menu">
      <LanguageSelector />
      <ThemeSelector />
      <HeaderName prefix="">{galasaServiceName}</HeaderName>
      <OverflowMenu
        data-floating-menu-container
        selectorPrimaryFocus={'.optionOne'}
        renderIcon={User}
        data-testid="menu-btn"
        size="lg"
        flipped={true}
      >
        <OverflowMenuItem
          itemText={translations('profile')}
          data-testid="my-profile-btn"
          onClick={handleRedirectToMyProfilePage}
        />
        <OverflowMenuItem
          itemText={translations('settings')}
          data-testid="my-settings-btn"
          onClick={handleRedirectToMySettingsPage}
        />
        <OverflowMenuItem
          itemText={translations('logout')}
          onClick={() => handleDeleteCookieApiOperation(router)}
          data-testid="logout-btn"
        />
      </OverflowMenu>
    </HeaderGlobalBar>
  );
}

export default PageHeaderMenu;
