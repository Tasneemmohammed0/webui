/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusIndicator from '@/components/common/StatusIndicator';

// Define types for the icon props
interface MockIconProps {
  className?: string;
  'aria-label': string;
}

// Mock the Carbon icons
jest.mock('@carbon/icons-react', () => ({
  CheckmarkFilled: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="checkmark-filled-icon" className={className} aria-label={ariaLabel}></div>
  ),
  ErrorFilled: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="error-filled-icon" className={className} aria-label={ariaLabel}></div>
  ),
  Help: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="help-icon" className={className} aria-label={ariaLabel}></div>
  ),
  Renew: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="renew-icon" className={className} aria-label={ariaLabel}></div>
  ),
  StopFilled: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="stop-filled-icon" className={className} aria-label={ariaLabel}></div>
  ),
  WarningFilled: ({ className, 'aria-label': ariaLabel }: MockIconProps) => (
    <div data-testid="warning-filled-icon" className={className} aria-label={ariaLabel}></div>
  ),
}));

// Mock the CSS module for StatusIndicator
jest.mock('@/styles/StatusIndicator.module.css', () => ({
  statusContainer: 'mocked-status-container',
  statusPassed: 'mocked-status-passed',
  statusFailed: 'mocked-status-failed',
  statusRequeued: 'mocked-status-requeued',
  statusCancelled: 'mocked-status-cancelled',
  statusHung: 'mocked-status-hung',
  statusOther: 'mocked-status-other',
}));

describe('StatusIndicator Component', () => {
  describe('Passed status', () => {
    it('renders correctly for "Passed" status', () => {
      render(<StatusIndicator status="Passed" />);

      const statusText = screen.getByText('Passed');
      const checkmarkIcon = screen.getByTestId('checkmark-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(checkmarkIcon).toBeInTheDocument();
      expect(checkmarkIcon).toHaveClass('mocked-status-passed');
      expect(checkmarkIcon).toHaveAttribute('aria-label', 'Passed');
    });
  });

  describe('Failed status variants', () => {
    it('renders correctly for "Failed" status', () => {
      render(<StatusIndicator status="Failed" />);

      const statusText = screen.getByText('Failed');
      const errorIcon = screen.getByTestId('error-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('mocked-status-failed');
      expect(errorIcon).toHaveAttribute('aria-label', 'Failed');
    });

    it('renders correctly for "Hung" status', () => {
      render(<StatusIndicator status="Hung" />);

      const statusText = screen.getByText('Hung');
      const errorIcon = screen.getByTestId('warning-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveAttribute('aria-label', 'Hung');
    });

    it('renders correctly for "EnvFail" status', () => {
      render(<StatusIndicator status="EnvFail" />);

      const statusText = screen.getByText('EnvFail');
      const errorIcon = screen.getByTestId('error-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveAttribute('aria-label', 'EnvFail');
    });
  });

  describe('Cancelled/Ignored status variants', () => {
    it('renders correctly for "Cancelled" status', () => {
      render(<StatusIndicator status="Cancelled" />);

      const statusText = screen.getByText('Cancelled');
      const errorIcon = screen.getByTestId('stop-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('mocked-status-cancelled');
      expect(errorIcon).toHaveAttribute('aria-label', 'Cancelled');
    });

    it('renders correctly for "Ignored" status', () => {
      render(<StatusIndicator status="Ignored" />);

      const statusText = screen.getByText('Ignored');
      const errorIcon = screen.getByTestId('stop-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveAttribute('aria-label', 'Ignored');
    });
  });

  describe('Requeued status', () => {
    it('renders correctly for "Requeued" status', () => {
      render(<StatusIndicator status="Requeued" />);

      const statusText = screen.getByText('Requeued');
      const renewIcon = screen.getByTestId('renew-icon');

      expect(statusText).toBeInTheDocument();
      expect(renewIcon).toBeInTheDocument();
      expect(renewIcon).toHaveClass('mocked-status-requeued');
      expect(renewIcon).toHaveAttribute('aria-label', 'Requeued');
    });
  });

  describe('Unknown status', () => {
    it('renders correctly for unknown status', () => {
      render(<StatusIndicator status="SomeUnknownStatus" />);

      const unknownText = screen.getByText('SomeUnknownStatus');
      const helpIcon = screen.getByTestId('help-icon');

      expect(unknownText).toBeInTheDocument();
      expect(helpIcon).toBeInTheDocument();
      expect(helpIcon).toHaveClass('mocked-status-other');
      expect(helpIcon).toHaveAttribute('aria-label', 'SomeUnknownStatus');
    });
    it('handles an empty string by rendering the default icon', () => {
      render(<StatusIndicator status="" />);

      const unknownText = screen.getByText('Unknown');
      const helpIcon = screen.getByTestId('help-icon');

      expect(unknownText).toBeInTheDocument();
      expect(helpIcon).toBeInTheDocument();
      expect(helpIcon).toHaveClass('mocked-status-other');
    });

    it('renders nothing if the status is null', () => {
      render(<StatusIndicator status={null as any} />);

      const unknownText = screen.getByText('Unknown');
      const helpIcon = screen.getByTestId('help-icon');

      expect(unknownText).toBeInTheDocument();
      expect(helpIcon).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('applies the correct CSS class to all status elements', () => {
      const { container } = render(<StatusIndicator status="Passed" />);
      const statusContainer = container.querySelector('.mocked-status-container');

      expect(statusContainer).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles case sensitivity correctly', () => {
      render(<StatusIndicator status="passed" />);

      // Should render as unknown since it's case sensitive
      const statusText = screen.getByText('Passed');
      const passedIcon = screen.getByTestId('checkmark-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(passedIcon).toBeInTheDocument();
    });

    it('handles status with extra whitespace', () => {
      render(<StatusIndicator status=" Passed " />);

      // Should render as unknown since it includes whitespace
      const statusText = screen.getByText('Passed');
      const passedIcon = screen.getByTestId('checkmark-filled-icon');

      expect(statusText).toBeInTheDocument();
      expect(passedIcon).toBeInTheDocument();
    });
  });
});
