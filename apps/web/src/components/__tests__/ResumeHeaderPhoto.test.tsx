import React from 'react'
import { render, screen } from '@testing-library/react'
import { ResumeHeaderPhoto } from '../ResumeHeaderPhoto'
import { useTheme } from 'next-themes'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ ...props }: any) => {
    delete props.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  },
}))

// Mock next-themes
const mockUseTheme = useTheme as jest.Mock
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

describe('ResumeHeaderPhoto Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders both light and dark photo containers', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' })
    render(<ResumeHeaderPhoto altText="Test Avatar" />)
    
    expect(screen.getByTestId('light-photo-container')).toBeInTheDocument()
    expect(screen.getByTestId('dark-photo-container')).toBeInTheDocument()
  })

  it('has opacity 1 on light photo container when theme is light', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'light' })
    render(<ResumeHeaderPhoto altText="Test Avatar" />)

    const lightContainer = screen.getByTestId('light-photo-container')
    const darkContainer = screen.getByTestId('dark-photo-container')

    expect(lightContainer.style.opacity).toBe('1')
    expect(darkContainer.style.opacity).toBe('0')
  })

  it('has opacity 1 on dark photo container when theme is dark', () => {
    mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' })
    render(<ResumeHeaderPhoto altText="Test Avatar" />)

    const lightContainer = screen.getByTestId('light-photo-container')
    const darkContainer = screen.getByTestId('dark-photo-container')

    expect(lightContainer.style.opacity).toBe('0')
    expect(darkContainer.style.opacity).toBe('1')
  })
})
