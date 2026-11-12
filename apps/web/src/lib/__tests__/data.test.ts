import { getPortfolioData, getBlogPostBySlug, getProjects } from '../data';

describe('data access API fetch handlers', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('handles successful API requests and formats the responses', async () => {
    const mockActiveProfile = {
      name: 'Test Name',
      title: 'Test Title',
      intro: 'Test Intro',
      photoUrlLight: '/light.png',
      photoUrlDark: '/dark.png',
      links: [
        { linkType: { keyIdentifier: 'github' }, url: 'github.com/test' },
        { linkType: { name: 'email' }, url: 'test@email.com' }
      ],
      workExperiences: [
        {
          displayOrder: 2,
          isPrevious: false,
          company: 'Company B',
          role: 'Dev B',
          period: '2021-2022',
          highlights: [{ displayOrder: 1, resultText: 'Result B' }],
          workExperienceSkills: [{ skill: { skillName: 'React' } }]
        },
        {
          displayOrder: 1,
          isPrevious: false,
          company: 'Company A',
          role: 'Dev A',
          period: '2020-2021',
          highlights: [{ displayOrder: 1, resultText: 'Result A' }],
          workExperienceSkills: [{ skill: { skillName: 'Next' } }]
        },
        {
          displayOrder: 3,
          isPrevious: true,
          company: 'Company Prev',
          role: 'Dev Prev',
          period: '2019-2020',
          location: 'Remote'
        }
      ]
    };

    const mockSkills = [
      {
        categoryName: 'Frontend',
        iconName: 'ReactIcon',
        skills: [{ displayOrder: 1, skillName: 'React' }]
      }
    ];

    const mockPosts = [
      {
        slug: 'my-post',
        title: 'My Post',
        summary: 'A short summary',
        content: '# Content'
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockActiveProfile })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSkills })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPosts });

    const data = await getPortfolioData();

    expect(data.personalInfo.name).toBe('Test Name');
    expect(data.personalInfo.title).toBe('Test Title');
    expect(data.personalInfo.photoUrlLight).toBe('/light.png');
    expect(data.resume.contact.links.find(l => l.type === 'github')?.url).toBe('github.com/test');
    expect(data.resume.contact.links.find(l => l.type === 'email')?.url).toBe('test@email.com');
    expect(data.resume.experience[0].company).toBe('Company A');
    expect(data.resume.experience[1].company).toBe('Company B');
    expect(data.resume.previousExperience[0].company).toBe('Company Prev');
    expect(data.resume.skills[0].category).toBe('Frontend');
    expect(data.resume.skills[0].items[0]).toBe('React');
    expect(data.blogPosts[0].slug).toBe('my-post');
  });

  it('falls back to default configurations gracefully when API throws errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));
    const data = await getPortfolioData();
    expect(data.personalInfo.name).toBe('Alvin Jorrel Pascual');
    expect(data.resume.contact.links.find(l => l.type === 'github')?.url).toBe('github.com/ajxcodes');
  });

  it('falls back to default configurations when responses are not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    const data = await getPortfolioData();
    expect(data.personalInfo.name).toBe('Alvin Jorrel Pascual');
  });

  it('handles json parse errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Parse Error'))
    });
    const data = await getPortfolioData();
    expect(data.personalInfo.name).toBe('Alvin Jorrel Pascual');
  });

  it('retrieves single blog post by slug from API successfully', async () => {
    const mockPost = { slug: 'post-2', title: 'Post Two', content: 'Content Two' };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockPost });
    const post = await getBlogPostBySlug('post-2');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Post Two');
    expect(post?.summary).toBe('');
  });

  it('returns undefined when blog post slug is not found or API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
    const postNotFound = await getBlogPostBySlug('post-none');
    expect(postNotFound).toBeUndefined();

    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });
    const postNotOk = await getBlogPostBySlug('post-none2');
    expect(postNotOk).toBeUndefined();

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Server Error'));
    const postError = await getBlogPostBySlug('post-1');
    expect(postError).toBeUndefined();
  });

  it('handles empty or null JSON structures for skills and blog posts', async () => {
    const mockActiveProfile = { name: 'Test Name', workExperiences: [] };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockActiveProfile })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ categoryName: 'Empty Category', skills: null }] })
      .mockResolvedValueOnce({ ok: true, json: async () => null });

    const data = await getPortfolioData();
    expect(data.resume.skills[0].category).toBe('Empty Category');
    expect(data.resume.skills[0].items).toEqual([]);
    expect(data.blogPosts).toEqual([]);
  });

  it('handles empty or null work experience details and link types', async () => {
    const mockActiveProfile = {
      name: 'Test Name',
      links: [
        { linkType: { name: 'fallback-type' }, url: 'test.com', displayInHeader: false },
        { linkType: null, url: 'invalid.com' }
      ],
      workExperiences: [
        {
          company: 'Null details',
          role: 'Dev',
          period: '2023',
          highlights: null,
          workExperienceSkills: [
            { skill: null },
            { skill: { skillName: 'Valid Skill' } }
          ]
        }
      ]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockActiveProfile })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const data = await getPortfolioData();
    expect(data.resume.experience[0].results).toEqual([]);
    expect(data.resume.experience[0].skills).toEqual(['Valid Skill']);
    expect(data.resume.contact.links[0].type).toBe('fallback-type');
    expect(data.resume.contact.links[0].displayInHeader).toBe(false);
    expect(data.resume.contact.links.length).toBe(1);
  });

  it('fetches and maps projects, filtering invisible ones', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'p1',
          slug: 'alpha',
          title: 'Alpha',
          summary: null,
          content: 'readme',
          visible: true,
          resumeProfileId: 'r1',
          authorName: 'A',
          datePosted: '2026-01-01T00:00:00Z',
          tags: null,
          projectLinks: null,
        },
        {
          id: 'p2',
          slug: 'hidden',
          title: 'Hidden',
          summary: 'x',
          content: 'x',
          visible: false,
          resumeProfileId: 'r1',
          authorName: 'A',
          datePosted: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const projects = await getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('Alpha');
    expect(projects[0].tags).toEqual([]);
    expect(projects[0].projectLinks).toEqual([]);
  });

  it('fetches a blog post by slug from the by-slug endpoint', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'b1',
        slug: 'my-post',
        title: 'My Post',
        summary: '',
        content: 'Body',
        datePosted: '2026-01-01T00:00:00Z',
        visible: true,
        resumeProfileId: 'r1',
        authorName: 'A',
        relatedProjects: []
      })
    });
    const post = await getBlogPostBySlug('my-post');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/blog/posts/slug/my-post'), expect.objectContaining({ cache: 'no-store' }));
    expect(post?.title).toBe('My Post');
  });

  it('maps related projects onto blog posts', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 'b1',
          slug: 'my-post',
          title: 'My Post',
          summary: '',
          content: 'Body',
          datePosted: '2026-01-01T00:00:00Z',
          visible: true,
          resumeProfileId: 'r1',
          authorName: 'A',
          relatedProjects: [
            null,
            { title: 'no id' },
            {
              id: 'p1',
              title: 'Alpha',
              slug: 'alpha',
              summary: 'Alpha summary',
              visible: false,
              projectLinks: null,
              releases: null
            },
            { id: 'p2' }
          ]
        },
        { id: 'b2', slug: 'hidden', title: 'H', summary: '', content: '', datePosted: '', visible: false, resumeProfileId: 'r1', authorName: 'A' }
      ])
    });
    const posts = await (await import('../data')).getBlogPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].relatedProjects).toHaveLength(2);
    expect(posts[0].relatedProjects?.[0].title).toBe('Alpha');
    expect(posts[0].relatedProjects?.[0].visible).toBe(false);
    expect(posts[0].relatedProjects?.[0].projectLinks).toEqual([]);
    expect(posts[0].relatedProjects?.[0].releases).toEqual([]);
    expect(posts[0].relatedProjects?.[1].title).toBe('');
    expect(posts[0].relatedProjects?.[1].slug).toBe('');
  });

  it('maps start date and releases onto projects', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 'p1',
          slug: 'alpha',
          title: 'Alpha',
          summary: 'A',
          content: 'C',
          datePosted: '2026-01-01T00:00:00Z',
          visible: true,
          resumeProfileId: 'r1',
          authorName: 'A',
          startDate: '2026-01-15T00:00:00Z',
          releases: [
            { tagName: 'v1.0.0', name: 'v1.0.0', url: 'https://example.com/v1', publishedAt: '2026-01-20T00:00:00Z', isPrerelease: false },
            { tagName: 'v2.0.0', isPrerelease: true },
            { tagName: '', name: 'bad' },
            null
          ]
        }
      ])
    });
    const projects = await getProjects();
    expect(projects[0].startDate).toBe('2026-01-15T00:00:00Z');
    expect(projects[0].releases).toHaveLength(2);
    expect(projects[0].releases?.[0].tagName).toBe('v1.0.0');
    expect(projects[0].releases?.[1].name).toBeNull();
    expect(projects[0].releases?.[1].url).toBe('');
    expect(projects[0].releases?.[1].isPrerelease).toBe(true);
  });

  it('returns empty projects when fetch fails or response not ok', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(getProjects()).resolves.toEqual([]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getProjects()).resolves.toEqual([]);
  });

  it('handles null payloads and fetch failures for blog/project endpoints', async () => {
    const { getBlogPosts } = await import('../data');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => null });
    await expect(getBlogPosts()).resolves.toEqual([]);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(getBlogPosts()).resolves.toEqual([]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => null });
    await expect(getProjects()).resolves.toEqual([]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => null });
    await expect(getBlogPostBySlug('missing')).resolves.toBeUndefined();
  });
});
