/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import AuthCookies from '@/utils/authCookies';
import { cookies } from 'next/headers';
import AccessTokensSection from '@/components/mysettings/AccessTokensSection';
import TokenResponseModal from '@/components/tokens/TokenResponseModal';
import PageTile from '@/components/PageTile';
import { UsersAPIApi } from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import * as Constants from '@/utils/constants/common';
import BreadCrumb from '@/components/common/BreadCrumb';
import { fetchAccessTokens } from '../../actions/getUserAccessTokens';
import ErrorPage from '../error/page';
import ExperimentalFeaturesSection from '@/components/mysettings/ExperimentalFeaturesSection';
import { HOME } from '@/utils/constants/breadcrumb';
import { fetchUserFromApiServer } from '@/actions/userServerActions';
import ProfileRole from '@/components/users/UserRole';
import DateTimeSettings from '@/components/mysettings/DateTimeSettings';
import ResultsTablePageSizeSetting from '@/components/mysettings/ResultsTablePageSizeSetting';
export default async function MySettings() {
  const apiConfig = createAuthenticatedApiConfiguration();

  const clientId = cookies().get(AuthCookies.CLIENT_ID)?.value ?? '';
  const refreshToken = cookies().get(AuthCookies.REFRESH_TOKEN)?.value ?? '';

  // Server Action to delete auth-related cookies
  const deleteCookies = async () => {
    'use server';

    cookies().delete(AuthCookies.CLIENT_ID);
    cookies().delete(AuthCookies.REFRESH_TOKEN);
  };

  const fetchUserLoginId = async () => {
    const usersApiClient = new UsersAPIApi(apiConfig);
    const userResponse = await usersApiClient.getUserByLoginId(Constants.CLIENT_API_VERSION, 'me');

    let loginId: string | undefined;
    if (userResponse.length > 0) {
      loginId = userResponse[0].loginId;
      if (!loginId) {
        throw new Error('Unable to get current user ID from the Galasa API server');
      }
    }
    return loginId;
  };

  // Await the login ID before using it
  const userLoginId = await fetchUserLoginId();

  if (!userLoginId) {
    return <ErrorPage />;
  }

  return (
    <main id="content">
      <BreadCrumb breadCrumbItems={[HOME]} />
      <PageTile translationKey="MySettings.title" />
      <ProfileRole userProfilePromise={fetchUserFromApiServer('me')} />
      <AccessTokensSection
        accessTokensPromise={fetchAccessTokens(userLoginId)}
        isAddBtnVisible={true}
      />
      <TokenResponseModal refreshToken={refreshToken} clientId={clientId} onLoad={deleteCookies} />
      <DateTimeSettings />
      <ResultsTablePageSizeSetting />
      <ExperimentalFeaturesSection />
    </main>
  );
}
