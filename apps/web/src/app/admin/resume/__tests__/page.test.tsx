import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ResumeProfilesPage from '../page';

jest.mock('lucide-react', () => ({
  UserSquare: () => <div data-testid="user-square-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  CheckCircle2: () => <div data-testid="check-circle2-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

const mockProfiles = [
  {
    id: 'profile-1',
    name: 'Active Profile',
    title: 'Senior Developer',
    intro: 'Intro for active profile',
    isActive: true,
    updatedAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 'profile-2',
    name: 'Inactive Profile',
    title: 'Junior Developer',
    intro: 'Intro for inactive profile',
    isActive: false,
    updatedAt: '2024-01-02T12:00:00Z',
  }
];

describe('ResumeProfilesPage', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/resume') && (!options || options.method === 'GET' || options.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfiles)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the resume profiles list', async () => {
    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Active Profile$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Senior Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/Junior Developer/i)).toBeInTheDocument();
    
    expect(screen.getByText(/New Profile/i)).toBeInTheDocument();
  });

  it('activates a profile', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'POST' && url.includes('/activate')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/resume')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfiles)
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    const activateButton = screen.getByRole('button', { name: /Activate/i });
    fireEvent.click(activateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resume/profile-2/activate'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('deletes a profile when confirmed', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/api/resume')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfiles)
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resume/profile-2'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('cancels deletion when cancel is clicked', async () => {
    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText(/delete_profile/i)).not.toBeInTheDocument();
  });

  it('displays error message when delete fails', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ ok: false, text: () => Promise.resolve('Error deleting') });
      }
      if (url.includes('/api/resume')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProfiles) });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error deleting/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no profiles', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/resume')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/No Profiles Configured/i)).toBeInTheDocument();
    });
  });

  it('displays error when loading profiles fails', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({ ok: false, status: 500 });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load profiles/i)).toBeInTheDocument();
    });
  });

  it('displays error when activating a profile fails', async () => {
    mockFetch.mockImplementation((url, options) => {
      if (options && options.method === 'POST' && url.includes('/activate')) {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('Error activating') });
      }
      if (url.includes('/api/resume')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfiles)
        });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Inactive Profile$/i })).toBeInTheDocument();
    });

    const activateButton = screen.getByRole('button', { name: /Activate/i });
    fireEvent.click(activateButton);

    await waitFor(() => {
      expect(screen.getByText(/Error activating/i)).toBeInTheDocument();
    });
  });

  it('fetches with authorization header when session exists', async () => {
    // Mock the session for this test only
    const { supabase } = require('@/lib/supabaseBrowser');
    supabase.auth.getSession.mockResolvedValueOnce({ 
      data: { session: { access_token: 'mock-token' } } 
    });

    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/resume')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProfiles) });
      }
      return Promise.resolve({ ok: true });
    });

    render(<ResumeProfilesPage />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resume'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token'
          })
        })
      );
    });
  });
});
