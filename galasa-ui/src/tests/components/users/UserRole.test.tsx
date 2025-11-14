/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import ProfileRole from '@/components/users/UserRole';
import { RBACRole } from '@/generated/galasaapi';
import { render, screen, waitFor } from '@testing-library/react';

// --- Mocks ---

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      userRoleTitle: 'User Role',
      changeRole:
        "User roles dictate what you can or can't do. Please contact your local Galasa administrator if you need this changed.",
      currentRole: 'You currently have the role',
      roleDescription: 'Details about role',
    };
    return translations[key] || key;
  },
}));

describe('ProfileRole Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly when user login id is found', async () => {
    const expectedLoginId = 'testuser';
    const expectedRoleName = 'tester';

    const mockRole: RBACRole = {
      apiVersion: 'v1',
      kind: 'GalasaRole',
      metadata: {
        name: expectedRoleName,
        description: 'a dummy role for tests',
      },
      data: {},
    };

    const fakeUser = {
      loginId: expectedLoginId,
      role: '1',
      synthetic: {
        role: mockRole,
      },
    };

    const userPromise = Promise.resolve(fakeUser);

    render(<ProfileRole userProfilePromise={userPromise} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          `You currently have the role: ${expectedRoleName.charAt(0).toUpperCase() + expectedRoleName.slice(1)}`
        )
      ).toBeInTheDocument();
    });
  });
});
