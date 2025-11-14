/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';

import ErrorPage from '@/app/error/page';
import { UserData } from '@/generated/galasaapi';
import styles from '@/styles/profile/MyProfile.module.css';
import { ProfileDetailsProps } from '@/utils/interfaces';
import { Loading } from '@carbon/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ProfileRole({ userProfilePromise }: ProfileDetailsProps) {
  const translations = useTranslations('ProfileRole');

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

  const roleName = userProfile.synthetic?.role?.metadata?.name;
  const roleDescription = userProfile.synthetic?.role?.metadata?.description;

  return (
    <div className={styles.profileDetails}>
      {isLoading ? (
        <Loading data-testid="loader" small={false} active={isLoading} />
      ) : (
        !isError && (
          <>
            <div className={styles.userDetailsContainer}>
              <h3>{translations('userRoleTitle')}</h3>
              <p>{translations('changeRole')}</p>
              <br />
              <p>
                {translations('currentRole')}:{' '}
                {roleName && roleName.charAt(0).toUpperCase() + roleName.slice(1)}
              </p>

              <div className="cds--form__helper-text">
                {roleDescription}.<br />
              </div>
            </div>
          </>
        )
      )}
      {isError && <ErrorPage />}
    </div>
  );
}
