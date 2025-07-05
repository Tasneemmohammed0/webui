/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import BreadCrumb from '@/components/common/BreadCrumb';
import PageTile from '@/components/PageTile';
import UsersTable from '@/components/users/UsersTable';
import { fetchUserFromApiServer } from '../../actions/userServerActions';
import { HOME } from '@/utils/constants/breadcrumb';
import { fetchAllUsersFromApiServer } from '@/utils/users';

export const dynamic = 'force-dynamic';

export default function UsersPage() {
  return (
    <main id="content">
      <BreadCrumb breadCrumbItems={[HOME]} />
      <PageTile translationKey={"UsersPage.title"} />
      <UsersTable usersListPromise={fetchAllUsersFromApiServer()} currentUserPromise={fetchUserFromApiServer("me")} />
    </main>
  );
}
