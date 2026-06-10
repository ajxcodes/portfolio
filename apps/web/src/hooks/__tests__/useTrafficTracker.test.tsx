import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { useTrafficTracker } from '../useTrafficTracker';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname() {
    return mockUsePathname();
  }
}));

function TestTrackerComponent() {
  useTrafficTracker();
  return (
    <div>
      <a href="https://github.com/ajxcodes" data-testid="github-link">GitHub</a>
      <a href="https://linkedin.com/in/alvin" data-testid="linkedin-link">LinkedIn</a>
      <a href="mailto:test@test.com" data-testid="mail-link">Mail</a>
      <a href="/resume.pdf" download data-testid="download-link">Download</a>
      <a href="/internal-page" data-testid="internal-link">Internal</a>
      <a href="https://external.com/file.zip" download data-testid="external-download-link">External Download</a>
      <a 
        href="https://external.com" 
        data-link-id="12345678-1234-1234-1234-1234567890ab" 
        data-testid="custom-guid-link"
      >
        Custom Link
      </a>
      <a 
        href="https://external.com" 
        data-link-id="invalid-guid" 
        data-testid="invalid-guid-link"
      >
        Invalid Link
      </a>
    </div>
  );
}

describe('useTrafficTracker Hook', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    
    // Setup window.location mock
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: '',
      href: 'http://localhost:3000/',
      host: 'localhost:3000'
    };

    sessionStorage.clear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
  });

  it('tracks page view on mount', () => {
    render(<TestTrackerComponent />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analytics/views'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"ReferrerSource":"Direct"')
      })
    );
  });

  it('saves and uses ref search query parameter as ReferrerSource', () => {
    window.location.search = '?ref=Twitter';
    render(<TestTrackerComponent />);

    expect(sessionStorage.getItem('referrer_source')).toBe('Twitter');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analytics/views'),
      expect.objectContaining({
        body: expect.stringContaining('"ReferrerSource":"Twitter"')
      })
    );
  });

  it('does not re-track page view if pathname remains unchanged', () => {
    const { rerender } = render(<TestTrackerComponent />);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    rerender(<TestTrackerComponent />);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('tracks new page view on path transition changes', () => {
    const { rerender } = render(<TestTrackerComponent />);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    mockUsePathname.mockReturnValue('/resume');
    rerender(<TestTrackerComponent />);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('tracks outbound link clicks only when data-link-id is present', () => {
    render(<TestTrackerComponent />);
    
    // Clear initial view tracking fetch calls
    (global.fetch as jest.Mock).mockClear();

    // 1. GitHub link without data-link-id — should NOT fire click analytics
    fireEvent.click(screen.getByTestId('github-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 2. LinkedIn link without data-link-id — should NOT fire click analytics
    fireEvent.click(screen.getByTestId('linkedin-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 3. Mail link without data-link-id — should NOT fire click analytics
    fireEvent.click(screen.getByTestId('mail-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 4. Download link without data-link-id — should NOT fire click analytics
    fireEvent.click(screen.getByTestId('download-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 5. External download link without data-link-id — should NOT fire click analytics
    fireEvent.click(screen.getByTestId('external-download-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 6. Link with a valid data-link-id — SHOULD fire click analytics with that GUID
    fireEvent.click(screen.getByTestId('custom-guid-link'));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analytics/clicks'),
      expect.objectContaining({
        body: expect.stringContaining('"LinkId":"12345678-1234-1234-1234-1234567890ab"')
      })
    );

    // 7. Link with an invalid (malformed) data-link-id — should NOT fire click analytics
    (global.fetch as jest.Mock).mockClear();
    fireEvent.click(screen.getByTestId('invalid-guid-link'));
    expect(global.fetch).not.toHaveBeenCalled();

    // 8. Internal link — should NOT track outbound analytics
    fireEvent.click(screen.getByTestId('internal-link'));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('unsubscribes and cleans up document event listener on unmount', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<TestTrackerComponent />);
    
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('catches and logs errors when fetch requests fail', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch rejection'));

    render(<TestTrackerComponent />);
    
    // Trigger link click fetch telemetry rejection
    const trackedLink = screen.getByTestId('custom-guid-link');
    fireEvent.click(trackedLink);

    // Wait for microtasks/promises to execute
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('does nothing when window is undefined', () => {
    const realWindow = global.window;
    
    // Mock react hooks to run synchronously
    const useEffectSpy = jest.spyOn(React, 'useEffect').mockImplementation(cb => cb());
    const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValue({ current: null });
    
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
      configurable: true
    });

    try {
      useTrafficTracker();
    } finally {
      // Restore window and spies
      Object.defineProperty(global, 'window', {
        value: realWindow,
        writable: true,
        configurable: true
      });
      useEffectSpy.mockRestore();
      useRefSpy.mockRestore();
    }
  });
});
