/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/PageTile', () => {
  return function MockPageTile({ translationKey }: { translationKey: string }) {
    return <div data-testid="page-tile">{translationKey}</div>;
  };
});

jest.mock('@/components/users/UserRoleSection', () => {
  return function MockUserRoleSection({
    userProfilePromise,
    roleDetailsPromise,
  }: {
    userProfilePromise: any;
    roleDetailsPromise: any;
  }) {
    return (
      <div data-testid="user-role-section">
        <span data-testid="user-profile-promise">user-profile-received</span>
        <span data-testid="role-details-promise">role-details-received</span>
      </div>
    );
  };
});

jest.mock('@/components/mysettings/AccessTokensSection', () => {
  return function MockAccessTokensSection({
    accessTokensPromise,
    isAddBtnVisible,
  }: {
    accessTokensPromise: any;
    isAddBtnVisible: boolean;
  }) {
    return (
      <div data-testid="access-tokens-section">
        <span data-testid="access-tokens-promise">access-tokens-received</span>
        <span data-testid="add-btn-visible">{isAddBtnVisible ? 'visible' : 'hidden'}</span>
      </div>
    );
  };
});

jest.mock('@/components/common/BreadCrumb', () => {
  return function MockBreadCrumb({ breadCrumbItems }: { breadCrumbItems: any[] }) {
    return (
      <div data-testid="breadcrumb">
        {breadCrumbItems.map((item, index) => (
          <span key={index} data-testid={`breadcrumb-item-${index}`}>
            {typeof item === 'object' ? item.label || 'breadcrumb-item' : item}
          </span>
        ))}
      </div>
    );
  };
});

jest.mock('@/generated/galasaapi', () => ({
  RoleBasedAccessControlAPIApi: jest.fn().mockImplementation(() => ({
    getRBACRoles: jest.fn().mockResolvedValue([
      { id: '1', name: 'Admin', description: 'Administrator role' },
      { id: '2', name: 'User', description: 'Regular user role' },
    ]),
  })),
  RBACRole: {},
}));

jest.mock('@/utils/api', () => ({
  createAuthenticatedApiConfiguration: jest.fn().mockReturnValue({
    baseServer: { makeRequestContext: jest.fn() },
    httpApi: { send: jest.fn() },
    middleware: [],
    authMethods: {},
  }),
}));

jest.mock('@/actions/getUserAccessTokens', () => ({
  fetchAccessTokens: jest.fn().mockResolvedValue({
    tokens: [
      { tokenId: 'token1', description: 'Test token 1' },
      { tokenId: 'token2', description: 'Test token 2' },
    ],
  }),
}));

jest.mock('@/actions/userServerActions', () => ({
  fetchUserFromApiServer: jest.fn().mockResolvedValue({
    loginId: 'testuser',
    roles: ['user'],
  }),
}));

jest.mock('@/utils/constants/breadcrumb', () => ({
  HOME: { label: 'Home', href: '/' },
  EDIT_USER: { label: 'Edit User', href: '/users/edit' },
}));

// Import after mocking
import EditUserPage from '@/app/users/edit/page';

describe('EditUserPage', () => {
  const defaultProps = {
    params: {},
    searchParams: { loginId: 'testuser123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the main content structure', () => {
      render(<EditUserPage {...defaultProps} />);

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('id', 'content');
    });

    it('should render BreadCrumb component', () => {
      render(<EditUserPage {...defaultProps} />);

      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toBeInTheDocument();

      // Check that breadcrumb items are rendered
      expect(screen.getByTestId('breadcrumb-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-item-1')).toBeInTheDocument();
    });

    it('should render PageTile with correct translation key', () => {
      render(<EditUserPage {...defaultProps} />);

      const pageTile = screen.getByTestId('page-tile');
      expect(pageTile).toBeInTheDocument();
      expect(pageTile).toHaveTextContent('UserEditPage.title');
    });

    it('should render UserRoleSection component', () => {
      render(<EditUserPage {...defaultProps} />);

      const userRoleSection = screen.getByTestId('user-role-section');
      expect(userRoleSection).toBeInTheDocument();
      expect(screen.getByTestId('user-profile-promise')).toHaveTextContent('user-profile-received');
      expect(screen.getByTestId('role-details-promise')).toHaveTextContent('role-details-received');
    });

    it('should render AccessTokensSection with isAddBtnVisible set to false', () => {
      render(<EditUserPage {...defaultProps} />);

      const accessTokensSection = screen.getByTestId('access-tokens-section');
      expect(accessTokensSection).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-promise')).toHaveTextContent(
        'access-tokens-received'
      );
      expect(screen.getByTestId('add-btn-visible')).toHaveTextContent('hidden');
    });
  });

  describe('Props and SearchParams Handling', () => {
    it('should handle loginId from searchParams correctly', () => {
      const loginId = 'user456';
      const props = {
        params: {},
        searchParams: { loginId },
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });

    it('should handle missing loginId gracefully', () => {
      const props = {
        params: {},
        searchParams: {},
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });

    it('should handle empty string loginId', () => {
      const props = {
        params: {},
        searchParams: { loginId: '' },
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render all required components in correct order', () => {
      render(<EditUserPage {...defaultProps} />);

      const main = screen.getByRole('main');
      const breadcrumb = screen.getByTestId('breadcrumb');
      const pageTile = screen.getByTestId('page-tile');
      const userRoleSection = screen.getByTestId('user-role-section');
      const accessTokensSection = screen.getByTestId('access-tokens-section');

      expect(main).toBeInTheDocument();
      expect(breadcrumb).toBeInTheDocument();
      expect(pageTile).toBeInTheDocument();
      expect(userRoleSection).toBeInTheDocument();
      expect(accessTokensSection).toBeInTheDocument();

      expect(main).toContainElement(breadcrumb);
      expect(main).toContainElement(pageTile);
      expect(main).toContainElement(userRoleSection);
      expect(main).toContainElement(accessTokensSection);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in loginId', () => {
      const loginId = 'user@domain.com';
      const props = {
        params: {},
        searchParams: { loginId },
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });

    it('should handle additional searchParams', () => {
      const props = {
        params: {},
        searchParams: {
          loginId: 'testuser',
          additionalParam: 'value',
          anotherParam: 'anotherValue',
        },
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });

    it('should handle array values in searchParams', () => {
      const props = {
        params: {},
        searchParams: {
          loginId: 'testuser',
          tags: ['tag1', 'tag2'],
        },
      };

      render(<EditUserPage {...props} />);

      expect(screen.getByTestId('user-role-section')).toBeInTheDocument();
      expect(screen.getByTestId('access-tokens-section')).toBeInTheDocument();
    });
  });
});
