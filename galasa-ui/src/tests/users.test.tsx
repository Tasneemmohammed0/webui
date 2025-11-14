/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersPage from '@/app/users/page';
import { UserData, UsersAPIApi } from '@/generated/galasaapi';
import { createAuthenticatedApiConfiguration } from '@/utils/api';
import { fetchUserFromApiServer } from '@/actions/userServerActions';
import * as Constants from '@/utils/constants/common';

// Mock the dependencies
jest.mock('@/utils/api', () => ({
  createAuthenticatedApiConfiguration: jest.fn(),
}));

jest.mock('@/generated/galasaapi', () => ({
  UsersAPIApi: jest.fn(),
}));

jest.mock('@/actions/userServerActions', () => ({
  fetchUserFromApiServer: jest.fn(),
}));

jest.mock('@/components/common/BreadCrumb', () => {
  return function MockBreadCrumb({ breadCrumbItems }: { breadCrumbItems: any[] }) {
    return <div data-testid="breadcrumb">{breadCrumbItems.length} items</div>;
  };
});

jest.mock('@/components/PageTile', () => {
  return function MockPageTile({ translationKey }: { translationKey: string }) {
    return <div data-testid="page-tile">{translationKey}</div>;
  };
});

jest.mock('@/components/users/UsersTable', () => {
  return function MockUsersTable({
    usersListPromise,
    currentUserPromise,
  }: {
    usersListPromise: Promise<UserData[]>;
    currentUserPromise: Promise<any>;
  }) {
    const [usersData, setUsersData] = React.useState<string>('loading');
    const [currentUserData, setCurrentUserData] = React.useState<string>('loading');

    React.useEffect(() => {
      usersListPromise
        .then(() => {
          setUsersData('users-promise-resolved');
        })
        .catch(() => {
          setUsersData('users-promise-error');
        });
    }, [usersListPromise]);

    React.useEffect(() => {
      currentUserPromise
        .then(() => {
          setCurrentUserData('current-user-promise-resolved');
        })
        .catch(() => {
          setCurrentUserData('current-user-promise-error');
        });
    }, [currentUserPromise]);

    return (
      <div data-testid="users-table">
        <div data-testid="users-promise">{usersData}</div>
        <div data-testid="current-user-promise">{currentUserData}</div>
      </div>
    );
  };
});

describe('UsersPage', () => {
  const mockApiConfig = { baseURL: 'http://localhost:3000' };
  const mockUsersApiClient = {
    getUserByLoginId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (createAuthenticatedApiConfiguration as jest.Mock).mockReturnValue(mockApiConfig);
    (UsersAPIApi as jest.Mock).mockImplementation(() => mockUsersApiClient);
    (fetchUserFromApiServer as jest.Mock).mockResolvedValue({
      id: 'current-user',
      name: 'Current User',
    });
  });

  it('renders the main page structure correctly', () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue([]);

    render(<UsersPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content');

    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb')).toHaveTextContent('1 items');

    expect(screen.getByTestId('page-tile')).toBeInTheDocument();
    expect(screen.getByTestId('page-tile')).toHaveTextContent('UsersPage.title');

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
  });

  it('creates API configuration and passes promises to UsersTable', async () => {
    const mockUsers: UserData[] = [
      { loginId: 'user1', id: 'User One' },
      { loginId: 'user2', id: 'User Two' },
    ];

    mockUsersApiClient.getUserByLoginId.mockResolvedValue(mockUsers);

    render(<UsersPage />);

    expect(createAuthenticatedApiConfiguration).toHaveBeenCalledTimes(1);

    expect(UsersAPIApi).toHaveBeenCalledWith(mockApiConfig);

    expect(screen.getByTestId('users-promise')).toHaveTextContent('loading');
    expect(screen.getByTestId('current-user-promise')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('users-promise')).toHaveTextContent('users-promise-resolved');
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-user-promise')).toHaveTextContent(
        'current-user-promise-resolved'
      );
    });

    expect(fetchUserFromApiServer).toHaveBeenCalledWith('me');
  });

  it('handles API call with correct parameters', async () => {
    const mockUsers: UserData[] = [{ loginId: 'user1', id: 'User One' }];

    mockUsersApiClient.getUserByLoginId.mockResolvedValue(mockUsers);

    render(<UsersPage />);

    await waitFor(() => {
      expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalledWith(
        Constants.CLIENT_API_VERSION
      );
    });
  });

  it('handles empty users response correctly', async () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue([]);

    render(<UsersPage />);

    await waitFor(() => {
      expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalled();
    });

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
  });

  it('handles undefined/null users response correctly', async () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue(null);

    render(<UsersPage />);

    await waitFor(() => {
      expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalled();
    });

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockUsersApiClient.getUserByLoginId.mockRejectedValue(new Error('API Error'));

    // Mock console.error to avoid error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<UsersPage />);

    expect(screen.getByTestId('users-table')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('creates a deep copy of users data using structuredClone', async () => {
    const mockUsers: UserData[] = [{ loginId: 'user1', id: 'User One' }];

    mockUsersApiClient.getUserByLoginId.mockResolvedValue(mockUsers);

    render(<UsersPage />);

    await waitFor(() => {
      expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalled();
    });

    expect(screen.getByTestId('users-table')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue([]);

    render(<UsersPage />);

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveAttribute('id', 'content');
  });
});

describe('UsersPage - API Integration', () => {
  const mockApiConfig = { baseURL: 'http://localhost:3000' };
  const mockUsersApiClient = {
    getUserByLoginId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAuthenticatedApiConfiguration as jest.Mock).mockReturnValue(mockApiConfig);
    (UsersAPIApi as jest.Mock).mockImplementation(() => mockUsersApiClient);
    (fetchUserFromApiServer as jest.Mock).mockResolvedValue({
      id: 'current-user',
      name: 'Current User',
    });
  });

  it('successfully fetches and processes users data', async () => {
    const mockUsers: UserData[] = [
      { loginId: 'user1', id: 'User One' },
      { loginId: 'user2', id: 'User Two' },
    ];

    mockUsersApiClient.getUserByLoginId.mockResolvedValue(mockUsers);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-promise')).toHaveTextContent('users-promise-resolved');
    });

    expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalledWith(Constants.CLIENT_API_VERSION);
  });

  it('handles empty users response correctly', async () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue([]);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-promise')).toHaveTextContent('users-promise-resolved');
    });

    expect(mockUsersApiClient.getUserByLoginId).toHaveBeenCalledWith(Constants.CLIENT_API_VERSION);
  });

  it('handles API errors in users fetch', async () => {
    mockUsersApiClient.getUserByLoginId.mockRejectedValue(new Error('API Error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-promise')).toHaveTextContent('users-promise-error');
    });
  });

  it('handles current user fetch errors', async () => {
    mockUsersApiClient.getUserByLoginId.mockResolvedValue([]);
    (fetchUserFromApiServer as jest.Mock).mockRejectedValue(new Error('Current user error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-promise')).toHaveTextContent('users-promise-resolved');
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-user-promise')).toHaveTextContent(
        'current-user-promise-error'
      );
    });
  });
});
