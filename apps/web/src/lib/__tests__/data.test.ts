import { getPortfolioData, getBlogPostBySlug } from '../data';

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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActiveProfile
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSkills
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts
      });

    const data = await getPortfolioData();

    // Verify profile parsing
    expect(data.personalInfo.name).toBe('Test Name');
    expect(data.personalInfo.title).toBe('Test Title');
    expect(data.personalInfo.photoUrlLight).toBe('/light.png');
    expect(data.resume.contact.links.find(l => l.type === 'github')?.url).toBe('github.com/test');
    expect(data.resume.contact.links.find(l => l.type === 'email')?.url).toBe('test@email.com');

    // Verify display order sorting
    expect(data.resume.experience[0].company).toBe('Company A');
    expect(data.resume.experience[1].company).toBe('Company B');
    
    // Verify previous experience mapping
    expect(data.resume.previousExperience[0].company).toBe('Company Prev');

    // Verify skills mapping
    expect(data.resume.skills[0].category).toBe('Frontend');
    expect(data.resume.skills[0].items[0]).toBe('React');

    // Verify blog mapping
    expect(data.blogPosts[0].slug).toBe('my-post');
  });

  it('falls back to default configurations gracefully when API throws errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    const data = await getPortfolioData();
    
    // Checks that fallback contains default static details
    expect(data.personalInfo.name).toBe('Alvin Jorrel Pascual');
    expect(data.resume.contact.links.find(l => l.type === 'github')?.url).toBe('github.com/ajxcodes');
  });

  it('falls back to default configurations when responses are not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    const data = await getPortfolioData();
    expect(data.personalInfo.name).toBe('Alvin Jorrel Pascual');
  });

  it('retrieves single blog post by slug from API successfully', async () => {
    const mockPosts = [
      { slug: 'post-1', title: 'Post One', summary: 'Summary One', content: 'Content One' },
      { slug: 'post-2', title: 'Post Two', content: 'Content Two' }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPosts
    });

    const post = await getBlogPostBySlug('post-2');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Post Two');
    expect(post?.summary).toBe(''); // Verify default empty fallback string
  });

  it('returns undefined when blog post slug is not found or API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const postNotFound = await getBlogPostBySlug('post-none');
    expect(postNotFound).toBeUndefined();

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Server Error'));
    const postError = await getBlogPostBySlug('post-1');
    expect(postError).toBeUndefined();
  });

  it('handles empty or null JSON structures for skills and blog posts', async () => {
    const mockActiveProfile = {
      name: 'Test Name',
      workExperiences: []
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActiveProfile
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { categoryName: 'Empty Category', skills: null }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActiveProfile
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    const data = await getPortfolioData();
    expect(data.resume.experience[0].results).toEqual([]);
    expect(data.resume.experience[0].skills).toEqual(['Valid Skill']);
    expect(data.resume.contact.links[0].type).toBe('fallback-type');
    expect(data.resume.contact.links[0].displayInHeader).toBe(false);
    expect(data.resume.contact.links.length).toBe(1); // the invalid link is ignored
  });
});
