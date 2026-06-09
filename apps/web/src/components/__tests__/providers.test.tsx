import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../providers';

const mockUseTrafficTracker = jest.fn();
jest.mock('@/hooks/useTrafficTracker', () => ({
  useTrafficTracker: () => mockUseTrafficTracker()
}));

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => <div data-testid="mock-next-themes">{children}</div>
}));

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    mockUseTrafficTracker.mockClear();
  });

  it('renders children and invokes useTrafficTracker', () => {
    render(
      <ThemeProvider>
        <span data-testid="child-element">Hello</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(mockUseTrafficTracker).toHaveBeenCalled();
  });
});
