import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Section } from '../Section'

const mockUseInView = jest.fn().mockReturnValue(true);
jest.mock('framer-motion', () => {
  const MockSection = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <section ref={ref} {...props}>{children}</section>
  ));
  MockSection.displayName = 'MockSection';

  const MockDiv = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  ));
  MockDiv.displayName = 'MockDiv';

  return {
    motion: {
      section: MockSection,
      div: MockDiv,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useInView: () => mockUseInView(),
  };
})

describe('Section Component', () => {
  it('renders title', () => {
    render(
      <Section title={<h2>Test Title</h2>}>
        <div>Test Content</div>
      </Section>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('is collapsed by default', () => {
    render(
      <Section title={<h2>Test Title</h2>}>
        <div>Test Content</div>
      </Section>
    )
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('is expanded by default if defaultOpen is true', () => {
    render(
      <Section title={<h2>Test Title</h2>} defaultOpen={true}>
        <div>Test Content</div>
      </Section>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('toggles expansion on click', () => {
    render(
      <Section title={<h2>Test Title</h2>}>
        <div>Test Content</div>
      </Section>
    )
    const button = screen.getByRole('button')
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('Test Content')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('toggles expansion on Enter and Space keys', () => {
    render(
      <Section title={<h2>Test Title</h2>}>
        <div>Test Content</div>
      </Section>
    )
    const button = screen.getByRole('button')
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(screen.getByText('Test Content')).toBeInTheDocument()

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' })
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()

    // Test other key (should not toggle)
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('renders correctly when not in view', () => {
    mockUseInView.mockReturnValueOnce(false)
    render(
      <Section title={<h2>Test Title</h2>}>
        <div>Test Content</div>
      </Section>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
})
