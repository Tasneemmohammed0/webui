/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import UserRoleSection from '@/components/users/UserRoleSection';
import { RBACRole, UserData } from '@/generated/galasaapi';
import { updateUserRoleAction } from '@/actions/userServerActions';
import { useRouter } from 'next/navigation';

// --- Mocks for Carbon Components --- //
jest.mock('@carbon/react', () => ({
  ButtonSet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: (props: any) => <button {...props}>{props.children}</button>,
  Dropdown: (props: any) => (
    // A simple select element that calls onChange with the selected item.
    <select
      data-testid="dropdown"
      onChange={(e) => props.onChange({ selectedItem: props.items[Number(e.target.value)] })}
    >
      {props.items.map((item: any, index: number) => (
        <option key={item.id} value={index}>
          {item.name}
        </option>
      ))}
    </select>
  ),
  Loading: (props: any) => <div data-testid="loading">Loading...</div>,
  InlineNotification: (props: any) => <div data-testid="notification">{props.title}</div>,
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      heading: 'User Role',
      description:
        'The actions a user can or cannot perform on this Galasa service is controlled by their user role.',
      dropdownLabel: 'User Role',
      resetButton: 'Reset',
      saveButton: 'Save',
      toastTitle: 'Success',
      toastSubtitle: 'User role was updated successfully.',
      errorTitle: 'Something went wrong!',
      errorDescription: 'Please report the problem to your Galasa Ecosystem administrator.',
    };
    return translations[key] || key;
  },
}));

// --- Mock updateUserRoleAction --- //
jest.mock('@/actions/userServerActions', () => ({
  updateUserRoleAction: jest.fn(),
}));

const mockRouter = {
  refresh: jest.fn(() => useRouter().refresh),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

// --- Dummy Data --- //
const dummyProfile: UserData = {
  id: '123',
  loginId: 'testuser',
  synthetic: {
    role: {
      metadata: {
        id: '1',
        name: 'tester',
        description: 'Test developer and runner',
        assignable: true,
      },
    },
  },
};

const dummyRoles: RBACRole[] = [
  {
    metadata: {
      id: '1',
      name: 'tester',
      description: 'Test developer and runner',
      assignable: true,
    },
  },
  {
    metadata: { id: '2', name: 'admin', description: 'Administrator', assignable: true },
  },
  {
    metadata: { id: '0', name: 'deactivated', description: 'User has no access', assignable: true },
  },
  {
    metadata: { id: '3', name: 'owner', description: 'Owner of Galasa service', assignable: false },
  },
];

describe('UserRoleSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading indicator while waiting for user profile', async () => {
    jest.useFakeTimers();

    const userProfilePromise = new Promise<UserData>((resolve) => {
      setTimeout(() => resolve(dummyProfile), 1000);
    });

    const rolesPromise = new Promise<RBACRole[]>((resolve) => {
      setTimeout(() => resolve([]), 1000);
    });

    render(
      <UserRoleSection userProfilePromise={userProfilePromise} roleDetailsPromise={rolesPromise} />
    );

    // Initially, the loading indicator should be visible.
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Fast-forward timers to resolve the promises.
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the user profile details to appear.
    await waitFor(() => {
      expect(screen.getByText(dummyProfile.loginId!)).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  test('displays error page if userProfilePromise rejects', async () => {
    // Suppress error logging.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorPromise = Promise.reject('Error');

    const rolesPromise = new Promise<RBACRole[]>((resolve) => {
      setTimeout(() => resolve([]), 1000);
    });

    render(<UserRoleSection userProfilePromise={errorPromise} roleDetailsPromise={rolesPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });
  });

  test('renders user profile details after successful load', async () => {
    const rolesPromise = new Promise<RBACRole[]>((resolve) => {
      setTimeout(() => resolve([]), 1000);
    });

    render(
      <UserRoleSection
        userProfilePromise={Promise.resolve(dummyProfile)}
        roleDetailsPromise={rolesPromise}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(dummyProfile.loginId!)).toBeInTheDocument();
    });
    // Also check for a header that is part of the component.
    expect(screen.getByText('User Role')).toBeInTheDocument();
  });

  test('save button calls updateUserRoleAction and shows success notification on successful update', async () => {
    // Cast the mocked action.
    const mockUpdateUserRoleAction = updateUserRoleAction as jest.Mock;
    // Simulate a successful response.
    mockUpdateUserRoleAction.mockResolvedValue({
      status: 200,
      message: 'User role updated successfully',
    });

    const rolesPromise = new Promise<RBACRole[]>((resolve) => {
      setTimeout(() => resolve(dummyRoles), 1000);
    });

    await rolesPromise;

    render(
      <UserRoleSection
        userProfilePromise={Promise.resolve(dummyProfile)}
        roleDetailsPromise={rolesPromise}
      />
    );

    // Wait for the component to display the user profile.
    await waitFor(() => {
      expect(screen.getByText(dummyProfile.loginId!)).toBeInTheDocument();
    });

    // Ensure the dropdown options have loaded.
    await waitFor(() => {
      const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
      const options = dropdown.querySelectorAll('option');
      expect(options.length).toBe(3);
    });

    const dropdown = screen.getByTestId('dropdown') as HTMLSelectElement;
    const saveButton = screen.getByText('Save') as HTMLButtonElement;

    // Change the dropdown selection to "admin" (index 1).
    fireEvent.change(dropdown, { target: { value: '1' } });

    // Click the save button.
    fireEvent.click(saveButton);

    // Wait for updateUserRoleAction to be called with the expected payload.
    await waitFor(() => {
      expect(mockUpdateUserRoleAction).toHaveBeenCalledWith({
        userNumber: dummyProfile.id,
        roleDetails: { role: '2' },
      });
    });

    // Wait for the success notification to appear.
    await waitFor(() => {
      expect(screen.getByTestId('notification')).toBeInTheDocument();
      expect(screen.getByTestId('notification')).toHaveTextContent('Success');
    });

    // After a successful update, both buttons should be disabled.
    expect(saveButton).toBeDisabled();
    const resetButton = screen.getByText('Reset') as HTMLButtonElement;
    expect(resetButton).toBeDisabled();
  });

  test('displays error page if updateUserRole fetch fails', async () => {
    const rolesPromise = new Promise<RBACRole[]>((resolve) => {
      setTimeout(() => resolve([]), 1000);
    });

    const mockFetch = jest.fn().mockRejectedValue(new Error('Failed'));
    (global.fetch as jest.Mock) = mockFetch;

    render(
      <UserRoleSection
        userProfilePromise={Promise.reject(dummyProfile)}
        roleDetailsPromise={rolesPromise}
      />
    );

    // When the fetch fails, the component sets isError to true and renders the ErrorPage.
    await waitFor(() => {
      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });
  });
});
