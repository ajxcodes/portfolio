import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Footer } from '../Footer';

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

const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const unsubscribeMock = jest.fn();
const mockOnAuthStateChange = jest.fn().mockImplementation(() => {
  return {
    data: {
      subscription: { unsubscribe: unsubscribeMock }
    }
  };
});

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb)
    }
  }
}));

describe('Footer Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockPush.mockClear();
    mockUsePathname.mockReturnValue('/');
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockSignOut.mockResolvedValue({});
    mockOnAuthStateChange.mockClear();
    unsubscribeMock.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renders standard live site footer with copyright and admin link', async () => {
    await act(async () => {
      render(<Footer />);
    });

    expect(screen.getByText(/github: operational/)).toBeInTheDocument();
    expect(screen.getByText(/render: operational/)).toBeInTheDocument();
    expect(screen.getByText(/ajxcodes/)).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Dashboard')).toBeInTheDocument();
  });

  it('checks auth status and subscribes to state change on mount', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@test.com' } } });
    
    await act(async () => {
      render(<Footer />);
    });

    expect(mockGetUser).toHaveBeenCalled();
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('bypasses normal auth when local dev bypass env variable is true', async () => {
    process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH = 'true';
    
    await act(async () => {
      mockUsePathname.mockReturnValue('/admin/dashboard');
      render(<Footer />);
    });

    expect(screen.getByText('local-admin@portfolio.local')).toBeInTheDocument();
    
    const signOutBtn = screen.getByText('Sign Out');
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('executes supabase signout and routes to login on admin signout click', async () => {
    process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH = 'false';
    mockUsePathname.mockReturnValue('/admin/dashboard');
    mockGetUser.mockResolvedValue({ data: { user: { email: 'real-admin@test.com' } } });

    await act(async () => {
      render(<Footer />);
    });

    expect(screen.getByText('real-admin@test.com')).toBeInTheDocument();
    
    const signOutBtn = screen.getByText('Sign Out');
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });

  it('handles user session auth status changes dynamically', async () => {
    process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH = 'false';
    mockUsePathname.mockReturnValue('/admin/dashboard');
    
    let authCallback: any = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: unsubscribeMock } } };
    });

    await act(async () => {
      render(<Footer />);
    });

    // Fire simulated auth change callback
    await act(async () => {
      authCallback('SIGNED_IN', { user: { email: 'changed@test.com' } });
    });

    expect(screen.getByText('changed@test.com')).toBeInTheDocument();

    // Fire auth change callback with no email to cover session.user.email || null
    await act(async () => {
      authCallback('SIGNED_IN', { user: {} });
    });
    expect(screen.queryByText('changed@test.com')).not.toBeInTheDocument();

    // Fire log out simulation
    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });

    expect(screen.queryByText('changed@test.com')).not.toBeInTheDocument();
  });

  it('handles initial auth user with no email to cover data.user.email || null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: {} } });
    mockUsePathname.mockReturnValue('/admin/dashboard');

    await act(async () => {
      render(<Footer />);
    });

    // Should render without username info
    expect(screen.queryByText('local-admin@portfolio.local')).not.toBeInTheDocument();
  });

  it('unsubscribes from auth session listener on unmount', async () => {
    let unmount: any;
    await act(async () => {
      const rendered = render(<Footer />);
      unmount = rendered.unmount;
    });

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
