import {
  fetchProfile,
  fetchSkills,
  saveProfile,
  createSkillInline,
  uploadAvatar,
  fetchGitHubUser
} from '../adminService';
import { supabase } from '@/lib/supabaseBrowser';

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

describe('adminService fetch and save handlers', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null }
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  describe('fetchProfile', () => {
    it('returns profile data on success', async () => {
      const mockProfile = { id: '1', name: 'John' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile
      });

      const data = await fetchProfile('1');
      expect(data).toEqual(mockProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resume/1'),
        expect.any(Object)
      );
    });

    it('throws error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(fetchProfile('1')).rejects.toThrow(
        'Profile not found or error loading data (404)'
      );
    });
  });

  describe('fetchSkills', () => {
    it('returns skills catalogs on success', async () => {
      const mockSkills = [{ id: 'cat-1', name: 'Languages' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkills
      });

      const data = await fetchSkills();
      expect(data).toEqual(mockSkills);
    });

    it('throws error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(fetchSkills()).rejects.toThrow(
        'Failed to load skills catalogs (500)'
      );
    });
  });

  describe('saveProfile', () => {
    it('returns profile JSON when creating a profile (POST with 201 status)', async () => {
      const payload = { name: 'John' };
      const mockCreatedProfile = { id: 'new-id', name: 'John' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedProfile
      });

      const result = await saveProfile(null, payload);
      expect(result).toEqual(mockCreatedProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/resume$/),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );
    });

    it('returns null when updating a profile (PUT with 204 status)', async () => {
      const payload = { name: 'John Updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      const result = await saveProfile('existing-id', payload);
      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resume/existing-id'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      );
    });

    it('throws error with response text when save fails', async () => {
      const errorMsg = 'Invalid payload format';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => errorMsg
      });

      await expect(saveProfile('existing-id', {})).rejects.toThrow(errorMsg);
    });
  });

  describe('createSkillInline', () => {
    it('returns created skill inline on success', async () => {
      const mockSkill = { id: 's1', skillName: 'React' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkill
      });

      const result = await createSkillInline('cat-1', 'React');
      expect(result).toEqual(mockSkill);
    });

    it('throws error when creation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      await expect(createSkillInline('cat-1', 'React')).rejects.toThrow(
        'Failed to create skill'
      );
    });
  });

  describe('uploadAvatar', () => {
    it('uploads file and returns URL on success', async () => {
      const mockResponse = { url: 'https://cdn/avatar.png' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const result = await uploadAvatar(file);
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Size too large'
      });

      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      await expect(uploadAvatar(file)).rejects.toThrow(
        'Size too large'
      );
    });
  });

  describe('fetchGitHubUser', () => {
    it('returns github user profile info on success', async () => {
      const mockUser = { login: 'octocat', avatar_url: 'https://octo.png' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await fetchGitHubUser('octocat');
      expect(result).toEqual(mockUser);
    });

    it('throws error when user not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(fetchGitHubUser('invalid-user')).rejects.toThrow(
        'GitHub user "invalid-user" not found.'
      );
    });
  });

  describe('fetchAuthHeaders auth token resolution', () => {
    it('includes bearer token when session is present', async () => {
      process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH = 'false';
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: { access_token: 'valid-token' } }
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await fetchSkills();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token'
          })
        })
      );
    });

    it('does not include Authorization header when bypass auth is active', async () => {
      process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH = 'true';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await fetchSkills();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
});
