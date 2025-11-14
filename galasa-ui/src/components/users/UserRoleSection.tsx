/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ProfileDetailsProps, UpdateUserRolePayload } from '@/utils/interfaces';
import { RBACRole, UserData } from '@/generated/galasaapi';
import styles from '@/styles/users/UserRole.module.css';
import { ButtonSet, Button, Dropdown, Loading } from '@carbon/react';
import ErrorPage from '@/app/error/page';
import { InlineNotification } from '@carbon/react';
import { updateUserRoleAction } from '@/actions/userServerActions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NOTIFICATION_VISIBLE_MILLISECS } from '@/utils/constants/common';

interface DropdownItem {
  name?: string;
  description?: string;
}

interface DropdownChangeEvent {
  selectedItem: {
    id: string;
    name: string;
    description: string;
  };
}

interface UserRoleMetadata {
  id?: string;
  name?: string;
  description?: string;
}

interface RoleDetailsProps {
  roleDetailsPromise: Promise<RBACRole[]>;
}

export default function UserRoleSection({
  userProfilePromise,
  roleDetailsPromise,
}: ProfileDetailsProps & RoleDetailsProps) {
  const translations = useTranslations('userRole');

  const [userProfile, setUserProfile] = useState<UserData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [role, setRole] = useState<UserRoleMetadata>({});
  const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState(true);
  const [isResetBtnDisabled, setIsResetBtnDisabled] = useState(true);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRoleMetadata[]>([]);

  const router = useRouter();

  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const loadedProfile = await userProfilePromise;
        setUserProfile(loadedProfile);

        setRole(loadedProfile.synthetic?.role?.metadata!);
      } catch (err) {
        setIsError(true);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadRoles = async () => {
      try {
        const loadedRoles = await roleDetailsPromise;

        if (loadedRoles) {
          const flattenedRoles = flattenUserRoleApi(loadedRoles);
          setUserRoles(flattenedRoles);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
    loadRoles();
  }, [userProfilePromise, roleDetailsPromise]);

  const flattenUserRoleApi = (rawRoles: RBACRole[]) => {
    const flattenedRoles = [];

    if (rawRoles.length >= 1) {
      for (let i = 0; i < rawRoles.length; i++) {
        if (rawRoles[i].metadata?.assignable) {
          const { id, name, description } = rawRoles[i].metadata!;
          const extractedInfo = { id, name, description };
          flattenedRoles.push(extractedInfo);
        }
      }
    }

    return flattenedRoles;
  };

  const changeUserRole = (event: DropdownChangeEvent) => {
    setRole({
      id: event.selectedItem.id,
      name: event.selectedItem.name,
      description: event.selectedItem.description,
    });

    if (userProfile.synthetic?.role?.metadata?.name === event.selectedItem.name) {
      setIsResetBtnDisabled(true);
      setIsSaveBtnDisabled(true);
    } else {
      setIsResetBtnDisabled(false);
      setIsSaveBtnDisabled(false);
    }
  };

  const resetRole = () => {
    setRole(userProfile.synthetic?.role?.metadata!);
    setIsResetBtnDisabled(true);
    setIsSaveBtnDisabled(true);
  };

  const updateUserRole = async () => {
    const requestBody: UpdateUserRolePayload = {
      roleDetails: {
        role: role.id!,
      },
      userNumber: userProfile.id!,
    };

    try {
      const response = await updateUserRoleAction(requestBody);

      if (response.status === 200) {
        setIsResetBtnDisabled(true);
        setIsSaveBtnDisabled(true);
        setIsToastVisible(true);

        router.refresh(); //refresh page so that the component latest user data from api server

        // Set timeout to hide the toast.
        toastTimer.current = setTimeout(() => {
          setIsToastVisible(false);
        }, NOTIFICATION_VISIBLE_MILLISECS);
      }
    } catch (err) {
      setIsError(true);
    }
  };

  useEffect(() => {
    // Cleanup on unmount: clear any pending timeout.
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  if (isLoading) {
    return <Loading small={false} active={isLoading} />;
  }

  if (isError) {
    return <ErrorPage />;
  }

  return (
    <div className={styles.roleDetails}>
      <div className={styles.roleDetailsContainer}>
        <h2>{userProfile.loginId}</h2>
        <h3>{translations('heading')}</h3>
        <p>{translations('description')}</p>
        <div className={styles.dropdownContainer}>
          <Dropdown
            selectedItem={role}
            onChange={(event: DropdownChangeEvent) => changeUserRole(event)}
            style={{ width: '35%' }}
            size="lg"
            id="default"
            helperText={role.description}
            label={translations('dropdownLabel')}
            items={userRoles}
            itemToString={(item: DropdownItem) => (item ? item.name : '')}
          />
          <ButtonSet className={styles.buttonSet}>
            <Button onClick={resetRole} disabled={isResetBtnDisabled} kind="secondary">
              {translations('resetButton')}
            </Button>
            <Button onClick={updateUserRole} disabled={isSaveBtnDisabled} kind="primary">
              {translations('saveButton')}
            </Button>
          </ButtonSet>
        </div>

        {isToastVisible && (
          <InlineNotification
            inline={true}
            onClose={() => setIsToastVisible(false)}
            lowContrast={true}
            kind="success"
            title={translations('toastTitle')}
            subtitle={translations('toastSubtitle')}
          />
        )}
      </div>
    </div>
  );
}
