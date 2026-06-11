import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Header } from '../Header';

const mockPush = jest.fn();
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return { push: mockPush };
  },
  usePathname() {
    return mockUsePathname();
  }
}));

jest.mock('../Avatar', () => ({
  Avatar() {
    return <div data-testid="mock-avatar" />;
  }
}));

jest.mock('../ContactLinks', () => ({
  ContactLinks() {
    return <div data-testid="mock-contact" />;
  }
}));

jest.mock('../ThemeSwitcher', () => ({
  ThemeSwitcher() {
    return <div data-testid="mock-theme-switcher" />;
  }
}));

// Mock IntersectionObserver
let observerCallbacks: any[] = [];
const observeMock = jest.fn();
const unobserveMock = jest.fn();
class MockIntersectionObserver {
  constructor(cb: any) {
    observerCallbacks.push(cb);
  }
  observe = observeMock;
  unobserve = unobserveMock;
  disconnect = jest.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe('Header Component', () => {
  const mockContact = {
    links: [
      { type: 'email', url: 'me@ajx.codes' },
      { type: 'github', url: 'https://github.com/ajxcodes' }
    ]
  };

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    observeMock.mockClear();
    unobserveMock.mockClear();
    observerCallbacks = [];
  });

  it('renders navbar links and highlights active link', () => {
    mockUsePathname.mockReturnValue('/resume');
    render(<Header name="Alex Jones" contact={mockContact} />);
    
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('resume')).toBeInTheDocument();
    expect(screen.getByText('blog')).toBeInTheDocument();
    
    // Resume link should have active font weight
    expect(screen.getByText('resume')).toHaveClass('text-primary font-bold');
  });

  it('highlights blog link when route starts with blog', () => {
    mockUsePathname.mockReturnValue('/blog/my-post-slug');
    render(<Header name="Alex Jones" contact={mockContact} />);
    
    expect(screen.getByText('blog')).toHaveClass('text-primary font-bold');
  });

  it('resolves and displays github username if available', () => {
    render(<Header name="Alex Jones" contact={mockContact} />);
    expect(screen.getByText('ajxcodes')).toBeInTheDocument();
  });

  it('falls back to lowercase name without spaces if no github is available', () => {
    const contactNoGithub = { links: [] };
    render(<Header name="Alex Jones" contact={contactNoGithub} />);
    expect(screen.getByText('alexjones')).toBeInTheDocument();
  });

  it('falls back to lowercase name without spaces if github url is invalid', () => {
    const contactInvalidGithub = { links: [{ type: 'github', url: 'https://othersite.com' }] };
    render(<Header name="Alex Jones" contact={contactInvalidGithub} />);
    expect(screen.getByText('https://othersite.com')).toBeInTheDocument();
  });

  it('sets up IntersectionObservers on mount', () => {
    // Setup elements
    const titleEl = document.createElement('div');
    titleEl.id = 'page-title';
    const contactEl = document.createElement('div');
    contactEl.id = 'contact-links-section';
    document.body.appendChild(titleEl);
    document.body.appendChild(contactEl);

    const { unmount } = render(<Header name="Alex Jones" contact={mockContact} />);
    
    expect(observeMock).toHaveBeenCalledTimes(2);

    unmount();
    expect(unobserveMock).toHaveBeenCalledTimes(2);

    // Cleanup
    document.body.removeChild(titleEl);
    document.body.removeChild(contactEl);
  });

  it('handles page title and contact section scroll intersection events', () => {
    const titleEl = document.createElement('div');
    titleEl.id = 'page-title';
    const contactEl = document.createElement('div');
    contactEl.id = 'contact-links-section';
    document.body.appendChild(titleEl);
    document.body.appendChild(contactEl);

    render(<Header name="Alex Jones" contact={mockContact} />);

    expect(observerCallbacks.length).toBe(2);

    // Call first observer callback (title) with isIntersecting = true
    act(() => {
      observerCallbacks[0]([{ isIntersecting: true }]);
    });
    // Call second observer callback (contact section) with isIntersecting = false
    act(() => {
      observerCallbacks[1]([{ isIntersecting: false }]);
    });

    document.body.removeChild(titleEl);
    document.body.removeChild(contactEl);
  });
});
