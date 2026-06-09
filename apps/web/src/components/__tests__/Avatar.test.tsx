import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

const mockUseTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme() {
    return mockUseTheme();
  }
}));

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: any) => {
    delete props.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

describe('Avatar Component', () => {
  beforeEach(() => {
    mockUseTheme.mockReset();
  });

  it('renders avatar with custom size after mounting', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    render(<Avatar altText="User size" size={150} />);
    
    const img = screen.getByAltText('User size');
    expect(img).toBeInTheDocument();
    expect(img).toHaveStyle({ width: '150px', height: '150px' });
  });

  it('renders light source under light theme', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
    render(<Avatar altText="User light" photoUrlLight="/custom_light.png" photoUrlDark="/custom_dark.png" />);
    
    const img = screen.getByAltText('User light');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/custom_light.png');
  });

  it('renders dark source under dark theme', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    render(<Avatar altText="User dark" photoUrlLight="/custom_light.png" photoUrlDark="/custom_dark.png" />);
    
    const img = screen.getByAltText('User dark');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/custom_dark.png');
  });

  it('uses fallbacks when no custom photo urls are passed', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
    const { rerender } = render(<Avatar altText="Fallback" />);
    expect(screen.getByAltText('Fallback')).toHaveAttribute('src', '/images/me_day.jpg');

    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    rerender(<Avatar altText="Fallback" />);
    expect(screen.getByAltText('Fallback')).toHaveAttribute('src', '/images/me_night.png');
  });
});
