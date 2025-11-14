/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import TokenResponseModal from '@/components/tokens/TokenResponseModal';
import { act, fireEvent, render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      modalHeading: 'Personal access token details',
      description1:
        'Copy the following property into the galasactl.properties file in your Galasa home directory* or set it as an environment variable in your terminal to allow your client tool to access the Galasa Ecosystem.',
      warningTitle:
        'The personal access token details are not stored and cannot be retrieved when this dialog is closed.',
      warningSubtitle: 'Remember to copy the details shown above before closing this dialog.',
      description2:
        '*If you do not have a galasactl.properties file in your Galasa home directory, run the following command in a terminal to create one:',
      commandExample: 'galasactl local init',
      seeDocsIntro: 'See the',
      seeDocsLinkText: 'Galasa documentation',
      seeDocsOutro: 'for more information.',
      loadError: 'Failed to load token response dialog:',
    };
    return translations[key] || key;
  },
}));

describe('Token response modal', () => {
  it('renders invisible token response modal if all properties are empty', async () => {
    // Given...
    await act(async () => {
      return render(<TokenResponseModal refreshToken="" clientId="" onLoad={async () => {}} />);
    });
    const responseModalElement = screen.getByRole('presentation');

    // Then...
    expect(responseModalElement).toBeInTheDocument();
    expect(responseModalElement).not.toHaveClass('is-visible');
  });

  it('renders invisible token response modal if the clientId property is empty', async () => {
    // Given...
    await act(async () => {
      return render(
        <TokenResponseModal refreshToken="dummytoken" clientId="" onLoad={async () => {}} />
      );
    });
    const responseModalElement = screen.getByRole('presentation');

    // Then...
    expect(responseModalElement).toBeInTheDocument();
    expect(responseModalElement).not.toHaveClass('is-visible');
  });

  it('renders invisible token response modal if the refreshToken property is empty', async () => {
    // Given...
    await act(async () => {
      return render(
        <TokenResponseModal refreshToken="" clientId="clientId" onLoad={async () => {}} />
      );
    });
    const responseModalElement = screen.getByRole('presentation');

    // Then...
    expect(responseModalElement).toBeInTheDocument();
    expect(responseModalElement).not.toHaveClass('is-visible');
  });

  it('becomes visible when all required properties are provided', async () => {
    // Given...
    await act(async () => {
      return render(
        <TokenResponseModal refreshToken="dummytoken" clientId="dummyid" onLoad={async () => {}} />
      );
    });
    const responseModalElement = screen.getByRole('presentation');

    // Then...
    expect(responseModalElement).toBeInTheDocument();
    expect(responseModalElement).toHaveClass('is-visible');
  });

  it('becomes invisible when the "Close" button is clicked', async () => {
    // Given...
    await act(async () => {
      return render(
        <TokenResponseModal refreshToken="dummytoken" clientId="dummyid" onLoad={async () => {}} />
      );
    });
    const modalCloseButtonElement = screen.getByLabelText(/close/i);
    const responseModalElement = screen.getByRole('presentation');

    // When...
    expect(responseModalElement).toHaveClass('is-visible');

    fireEvent.click(modalCloseButtonElement);

    // Then...
    expect(responseModalElement).not.toHaveClass('is-visible');
  });
});
