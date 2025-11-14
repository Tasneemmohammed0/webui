/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import TokenRequestModal from '@/components/tokens/TokenRequestModal';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      new_access_token: 'Create new access token',
      modal_heading: 'Create Galasa Personal Access Token',
      create: 'Create',
      cancel: 'Cancel',
      token_description:
        'A personal access token is an alternative to using a password for authentication and can be used to allow client tools to access the Galasa Ecosystem on your behalf. Keep your personal access tokens secret and treat them like passwords.',
      token_name_description: 'You are about to allocate a new token, please give the token a name',
      token_name: 'Token name',
      token_name_helper_text: 'Use this to distinguish between your tokens in the future.',
      token_name_placeholder: 'e.g. galasactl access for my Windows machine',
      error_requesting_token: 'Error requesting access token',
    };
    return translations[key] || key;
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Token request modal', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: { replace: jest.fn() },
    });
  });

  afterEach(() => {
    window.location.href = '';
  });

  it('renders invisible token request modal', async () => {
    // Given...
    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const buttonElement = screen.getByRole('token-request-btn');
    const requestModalElement = screen.getByRole('presentation');

    // Then...
    expect(requestModalElement).not.toHaveClass('is-visible');
    expect(buttonElement).toBeInTheDocument();
    expect(requestModalElement).toBeInTheDocument();
  });

  it('becomes visible when the "Request Access Token" button is clicked', async () => {
    // Given...
    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const buttonElement = screen.getByRole('token-request-btn');
    const requestModalElement = screen.getByRole('presentation');

    // When...
    fireEvent.click(buttonElement);

    // Then...
    expect(requestModalElement).toHaveClass('is-visible');
  });

  it('becomes invisible when the "Cancel" button is clicked', async () => {
    // Given...
    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalCancelButtonElement = screen.getByText(/Cancel/i);
    const requestModalElement = screen.getByRole('presentation');

    // When...
    fireEvent.click(openModalButtonElement);
    expect(requestModalElement).toHaveClass('is-visible');

    fireEvent.click(modalCancelButtonElement);

    // Then...
    expect(requestModalElement).not.toHaveClass('is-visible');
  });

  it('sends request for a new personal access token on submit', async () => {
    // Given...
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: redirectUrl }),
      })
    ) as jest.Mock;

    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalCreateButtonElement = screen.getByText(/^Create$/);
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // When...
    fireEvent.click(openModalButtonElement);
    fireEvent.input(modalNameInputElement, { target: { value: 'dummy' } });
    fireEvent.click(modalCreateButtonElement);

    // Then...
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });

  it('renders an error notification when the token POST request returns an error response', async () => {
    // Given...
    const fetchErrorMessage = 'this is an error!';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: fetchErrorMessage,
      })
    ) as jest.Mock;

    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalSubmitButtonElement = screen.getByText(/^Create$/);
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // The error notification should not exist yet
    const errorMessage = /error requesting access token/i;
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.input(modalNameInputElement, { target: { value: 'dummy' } });
      fireEvent.click(modalSubmitButtonElement);
    });

    // Then...
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const errorNotificationElement = screen.getByText(errorMessage);
    const errorMessageElement = screen.getByText(fetchErrorMessage);

    expect(errorNotificationElement).toBeInTheDocument();
    expect(errorMessageElement).toBeInTheDocument();
  });

  it('renders an error notification when a token request returns an error', async () => {
    // Given...
    const fetchErrorMessage = 'this is an error!';
    global.fetch = jest.fn(() => Promise.reject(fetchErrorMessage)) as jest.Mock;

    await act(async () => {
      render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalSubmitButtonElement = screen.getByText(/^Create$/);
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // The error notification should not exist yet
    const errorMessage = /error requesting access token/i;
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.input(modalNameInputElement, { target: { value: 'dummy' } });
      fireEvent.click(modalSubmitButtonElement);
    });

    // Then...
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const errorNotificationElement = screen.getByText(errorMessage);
    const errorMessageElement = screen.getByText(fetchErrorMessage);

    expect(errorNotificationElement).toBeInTheDocument();
    expect(errorMessageElement).toBeInTheDocument();
  });

  it('closes the error notification when the user clicks the close icon on the notification', async () => {
    // Given...
    const fetchErrorMessage = 'this is an error!';
    global.fetch = jest.fn(() => Promise.reject(fetchErrorMessage)) as jest.Mock;

    await act(async () => {
      render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalSubmitButtonElement = screen.getByText(/^Create$/);
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // The error notification should not exist yet
    const errorMessage = /error requesting access token/i;
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.input(modalNameInputElement, { target: { value: 'dummy' } });
      fireEvent.click(modalSubmitButtonElement);
    });

    // Then...
    // The error notification should be visible
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const errorNotificationElement = screen.getByText(errorMessage);
    expect(errorNotificationElement).toBeInTheDocument();

    // Clicking the close notification button should remove the error notification
    const errorNotificationCloseButtonElement = screen.getByLabelText(/close notification/i);
    fireEvent.click(errorNotificationCloseButtonElement);
    expect(errorNotificationElement).not.toBeInTheDocument();
  });

  it('does not submit a request for a token when both input fields are empty', async () => {
    // Given...
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    await act(async () => {
      render(<TokenRequestModal isDisabled={false} />);
    });

    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalSubmitButtonElement = screen.getByText(/^Create$/);

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.click(modalSubmitButtonElement);
    });

    // Then...
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not submit a request for a token when both input fields are empty', async () => {
    // Given...
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    await act(async () => {
      render(<TokenRequestModal isDisabled={false} />);
    });

    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.keyDown(modalNameInputElement, { key: 'Enter', keyCode: 13 });
    });

    // Then...
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends request for a new personal access token on pressing enter key', async () => {
    // Given...
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: redirectUrl }),
      })
    ) as jest.Mock;

    await act(async () => {
      return render(<TokenRequestModal isDisabled={false} />);
    });
    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalNameInputElement = screen.getByLabelText(/Token Name/i);

    // When...
    fireEvent.click(openModalButtonElement);
    fireEvent.input(modalNameInputElement, { target: { value: 'dummy' } });
    fireEvent.keyDown(modalNameInputElement, { key: 'Enter', keyCode: 13 });

    // Then...
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
  });

  it('does not submit a request for a token when the token name field is empty', async () => {
    // Given...
    const redirectUrl = 'http://my-connector/auth';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        url: redirectUrl,
      })
    ) as jest.Mock;

    await act(async () => {
      render(<TokenRequestModal isDisabled={false} />);
    });

    const openModalButtonElement = screen.getByRole('token-request-btn');
    const modalSubmitButtonElement = screen.getByText(/^Create$/);

    // When...
    await act(async () => {
      fireEvent.click(openModalButtonElement);
      fireEvent.click(modalSubmitButtonElement);
    });

    // Then...
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
