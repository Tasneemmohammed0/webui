/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import ErrorPage from '@/app/error/page';
import { useDateTimeFormat } from '@/contexts/DateTimeFormatContext';
import { UserData } from '@/generated/galasaapi';
import styles from '@/styles/profile/MyProfile.module.css';
import { ProfileDetailsProps } from '@/utils/interfaces';
import { Loading } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ProfileDetails({ userProfilePromise }: ProfileDetailsProps) {
  const WEB_UI_CLIENT_NAME = 'web-ui';
  const translations = useTranslations('ProfileDetails');
  const { formatDate } = useDateTimeFormat();

  const [userProfile, setUserProfile] = useState<UserData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const loadedProfile = await userProfilePromise;
        setUserProfile(loadedProfile);
      } catch (err) {
        setIsError(true);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userProfilePromise]);

  return (
    <div className={styles.profileDetails}>
      {isLoading ? (
        <Loading data-testid="loader" small={false} active={isLoading} />
      ) : (
        !isError && (
          <>
            <div className={styles.userDetailsContainer}>
              <h3>{translations('title')}</h3>
              <p>
                {translations('loggedInAs')} {userProfile?.loginId}
              </p>
            </div>

            <div className={styles.loginActivityContainer}>
              <h3>{translations('recentActivity')}</h3>
              {userProfile?.clients?.map((client, index) => {
                let lastLoginDateStr: string;
                if (client.lastLogin) {
                  const clientLastLoginDate = new Date(client.lastLogin);
                  lastLoginDateStr = `${formatDate(clientLastLoginDate)}`;
                } else {
                  lastLoginDateStr = translations('noLastLogin');
                }

                return (
                  <p key={index}>
                    {client.clientName === WEB_UI_CLIENT_NAME
                      ? translations('lastLoginWeb', { date: lastLoginDateStr })
                      : translations('lastLoginToken', { date: lastLoginDateStr })}
                  </p>
                );
              })}
            </div>
          </>
        )
      )}
      {isError && <ErrorPage />}
    </div>
  );
}
