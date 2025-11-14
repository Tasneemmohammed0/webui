/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BreadCrumb from '@/components/common/BreadCrumb';

// Mock useTranslations hook to return a mock translation function
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    return key;
  },
}));

// Mock next/navigation useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockBreadCrumbItems = [
  { title: 'Home', route: '/', values: {} },
  { title: 'Test Runs', route: '/test-runs', values: {} },
  { title: 'Test Run Details', route: '/test-runs/details', values: {} },
];

describe('BreadCrumb Component', () => {
  test('renders breadcrumb items correctly', () => {
    render(<BreadCrumb breadCrumbItems={mockBreadCrumbItems} />);

    // Check if all breadcrumb items are rendered
    mockBreadCrumbItems.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    });
  });

  test('does not render overflow menu when items are below threshold', () => {
    render(<BreadCrumb breadCrumbItems={mockBreadCrumbItems} />);

    // Check if the overflow menu is not rendered
    const overflowMenu = screen.queryByTestId('breadcrumb-overflow-menu');
    expect(overflowMenu).not.toBeInTheDocument();
  });

  test('renders overflow menu when items exceed threshold', () => {
    const extendedItems = [
      ...mockBreadCrumbItems,
      { title: 'Extra Item', route: '/extra', values: {} },
      { title: 'Another Item', route: '/another', values: {} },
    ];
    render(<BreadCrumb breadCrumbItems={extendedItems} />);

    // Check if the overflow menu is rendered
    const overflowMenu = screen.getByTestId('breadcrumb-overflow-menu');
    expect(overflowMenu).toBeInTheDocument();

    // Check that overflow items are not rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Test Runs')).toBeInTheDocument();
    expect(screen.queryByText('Test Run Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Extra Item')).toBeInTheDocument();
  });
});
