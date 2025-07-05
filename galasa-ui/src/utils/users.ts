/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { UserData, UsersAPIApi } from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import * as Constants from "@/utils/constants/common";

export const fetchAllUsersFromApiServer = async () => {

  let users: UserData[] = [];
  
  const apiConfig = createAuthenticatedApiConfiguration();
  const usersApiClient = new UsersAPIApi(apiConfig);
  const usersReponse = await usersApiClient.getUserByLoginId(Constants.CLIENT_API_VERSION);
  
  if (usersReponse && usersReponse.length >= 1) {
    users = structuredClone(usersReponse);
  }
  
  return users;
};
  