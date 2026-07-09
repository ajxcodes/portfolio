import { renderHook, act } from '@testing-library/react';
import { useJobFit } from '../useJobFit';

describe('useJobFit Hook', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5808' };
    jest.clearAllMocks();
    sessionStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        matchScore: 85,
        company: 'Test Company',
        role: 'Test Role',
        growthOpportunities: [],
        actionChips: []
      })
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('appends VisitorSessionId to FormData when present in sessionStorage', async () => {
    sessionStorage.setItem('visitor_session_id', 'test-session-id');

    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({
        url: 'https://example.com/job'
      });
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const formData = callArgs[1].body as FormData;

    expect(formData.get('VisitorSessionId')).toBe('test-session-id');
    expect(formData.get('Url')).toBe('https://example.com/job');
  });

  it('does not append VisitorSessionId when it is missing in sessionStorage', async () => {
    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({
        url: 'https://example.com/job'
      });
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const formData = callArgs[1].body as FormData;

    expect(formData.has('VisitorSessionId')).toBe(false);
    expect(formData.get('Url')).toBe('https://example.com/job');
  });

  it('submits rawText to FormData', async () => {
    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({
        rawText: 'Test Job Description'
      });
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const formData = callArgs[1].body as FormData;

    expect(formData.get('RawText')).toBe('Test Job Description');
  });

  it('submits file to FormData', async () => {
    const { result } = renderHook(() => useJobFit());

    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    
    await act(async () => {
      await result.current.analyzeJobFit({ file });
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const formData = callArgs[1].body as FormData;

    expect(formData.get('File')).toBe(file);
  });

  it('handles fetch errors (non-ok response)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue('API Error Occurred')
    });

    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({ rawText: 'test' });
    });

    expect(result.current.error).toBe('API Error Occurred');
    expect(result.current.analysisResult).toBeNull();
  });

  it('handles network exceptions', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Failure'));

    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({ rawText: 'test' });
    });

    expect(result.current.error).toBe('Network Failure');
    expect(result.current.analysisResult).toBeNull();
  });

  it('handles default values when API omits fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        matchScore: 50
        // missing company, role, etc.
      })
    });

    const { result } = renderHook(() => useJobFit());

    let response: any;
    await act(async () => {
      response = await result.current.analyzeJobFit({ rawText: 'test' });
    });

    expect(response.company).toBe('Unknown Company');
    expect(response.role).toBe('Unknown Role');
    expect(response.growthOpportunities).toEqual([]);
    expect(response.actionChips).toEqual([]);
    expect(result.current.analysisResult).toEqual(response);
  });

  it('clears analysis result and error', async () => {
    const { result } = renderHook(() => useJobFit());

    await act(async () => {
      await result.current.analyzeJobFit({ url: 'test' });
    });

    expect(result.current.analysisResult).not.toBeNull();

    act(() => {
      result.current.clearAnalysis();
    });

    expect(result.current.analysisResult).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
