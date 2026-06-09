import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSwitcher } from '../ThemeSwitcher';

const mockSetTheme = jest.fn();
const mockUseTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme() {
    return mockUseTheme();
  }
}));

jest.mock('@/components/icons', () => ({
  SunIcon: ({ className }: any) => <div data-testid="sun-icon" className={className} />,
  MoonIcon: ({ className }: any) => <div data-testid="moon-icon" className={className} />,
  SystemThemeIcon: ({ className }: any) => <div data-testid="system-icon" className={className} />
}));

describe('ThemeSwitcher Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockUseTheme.mockReset();
  });

  it('renders correct current theme states after mounting', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });
    const { rerender } = render(<ThemeSwitcher />);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();

    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme });
    rerender(<ThemeSwitcher />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme });
    rerender(<ThemeSwitcher />);
    expect(screen.getByTestId('system-icon')).toBeInTheDocument();
  });

  it('cycles from light to dark on toggle click', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });
    render(<ThemeSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system on toggle click', () => {
    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme });
    render(<ThemeSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light on toggle click', () => {
    mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme });
    render(<ThemeSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
