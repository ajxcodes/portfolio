const http = require('http');

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://127.0.0.1:5808';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const bodyStr = body ? JSON.stringify(body) : null;

    if (bodyStr) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    console.log(`[HTTP Request] ${reqOptions.method} ${url}`);

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`[HTTP Response] ${res.statusCode} for ${reqOptions.method} ${parsedUrl.pathname}`);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (e) {
              return Promise.reject(new Error(`Failed to parse JSON: ${data}`));
            }
          },
        });
      });
    });

    req.on('error', (err) => {
      console.error(`[HTTP Error] ${reqOptions.method} ${url}:`, err.message);
      reject(err);
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function ensureOk(res, label) {
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function deleteBySlug(resourcePath, slug) {
  try {
    const listRes = await request(`${apiUrl}${resourcePath}`);
    if (!listRes.ok) {
      console.warn(`Could not list ${resourcePath} for slug cleanup (${slug}): ${listRes.status}`);
      return;
    }
    const items = await listRes.json();
    const matches = Array.isArray(items) ? items.filter((item) => item && item.slug === slug) : [];
    for (const item of matches) {
      const delRes = await request(`${apiUrl}${resourcePath}/${item.id}`, { method: 'DELETE' });
      if (delRes.ok || delRes.status === 404) {
        console.log(`Deleted existing ${resourcePath} fixture with slug ${slug} (${item.id})`);
      } else {
        console.warn(`Failed to delete ${resourcePath} fixture ${item.id} (${slug}): ${delRes.status} ${await delRes.text()}`);
      }
    }
  } catch (e) {
    console.warn(`Error while cleaning ${resourcePath} slug ${slug}:`, e);
  }
}

async function seed() {
  console.log(`Seeding database via API at ${apiUrl}...`);

  // 1. Attempt to create a skill category – if the endpoint does not exist, continue without it.
  let category = null;
  try {
    const catRes = await request(`${apiUrl}/api/resume/skills/categories`, {
      method: 'POST'
    }, {
      categoryName: "Languages & Frameworks",
      iconName: "CodeIcon",
      displayOrder: 1
    });
    if (catRes.ok) {
      category = await catRes.json();
      console.log(`Created skill category: ${category.id}`);
    } else if (catRes.status === 404) {
      console.warn('Skill category endpoint not found (404); proceeding without creating a category.');
    } else {
      throw new Error(`Failed to create skill category: ${catRes.status} ${await catRes.text()}`);
    }
  } catch (e) {
    console.error('Error creating skill category:', e);
  }

  // 2. (Optional) Create skills – only if a category was successfully created.
  if (category) {
    const skillsToCreate = ["TypeScript", "React", "C#", ".NET"];
    for (let i = 0; i < skillsToCreate.length; i++) {
      const skillName = skillsToCreate[i];
      try {
        const skillRes = await request(`${apiUrl}/api/resume/skills`, {
          method: 'POST'
        }, {
          categoryId: category.id,
          skillName,
          displayOrder: i + 1
        });
        if (skillRes.ok) {
          const skill = await skillRes.json();
          console.log(`Created skill: ${skillName} (${skill.id})`);
        } else {
          console.warn(`Skill creation failed for ${skillName}: ${skillRes.status}`);
        }
      } catch (e) {
        console.warn(`Error creating skill ${skillName}:`, e);
      }
    }
  }

  // 3. Create a resume profile
  const profileRes = await request(`${apiUrl}/api/resume`, {
    method: 'POST'
  }, {
    name: "Test User",
    title: "Full Stack Developer",
    intro: "Hello world",
    links: [
      {
        linkTypeName: "GitHub",
        linkTypeKey: "github",
        url: "https://github.com/ajxcodes"
      }
    ]
  });

  const profile = await ensureOk(profileRes, 'Create resume profile');
  console.log(`Created profile: ${profile.id}`);

  // 4. Activate the profile
  const activateRes = await request(`${apiUrl}/api/resume/${profile.id}/activate`, {
    method: 'POST'
  });
  await ensureOk(activateRes, 'Activate resume profile');
  console.log(`Activated profile: ${profile.id}`);

  // 5. Seed a blog post that shares a tag with a project (content-type separation fixture)
  await deleteBySlug('/api/blog/posts', 'seeded-blog-post');
  const blogRes = await request(`${apiUrl}/api/blog/posts`, { method: 'POST' }, {
    title: 'Seeded Blog Post',
    slug: 'seeded-blog-post',
    summary: 'A seeded blog post for e2e fixtures.',
    content: 'This post shares a tag name with a seeded project.',
    visible: true,
    canonicalUrl: null,
    resumeProfileId: profile.id,
    tags: ['shared-tag', 'blog-only']
  });
  if (blogRes.ok) {
    const blog = await blogRes.json();
    console.log(`Created seeded blog post: ${blog.id}`);
  } else {
    console.warn(`Seed blog post creation failed: ${blogRes.status} ${await blogRes.text()}`);
  }

  // 6. Seed projects for public list/detail and tag filtering
  const projects = [
    {
      title: 'Alpha Seed Project',
      slug: 'alpha-seed-project',
      summary: 'Alpha seeded project summary.',
      content: '# Alpha Seed Project\n\nAlpha README body for e2e verification.',
      visible: true,
      canonicalUrl: null,
      resumeProfileId: profile.id,
      tags: ['shared-tag', 'alpha'],
      projectLinks: [
        { type: 'homepage', url: 'https://alpha.example.com', label: 'Homepage' },
        { type: 'github', url: 'https://github.com/example/alpha-seed', label: 'GitHub' }
      ]
    },
    {
      title: 'Beta Seed Project',
      slug: 'beta-seed-project',
      summary: 'Beta seeded project summary.',
      content: '# Beta Seed Project\n\nBeta README body for e2e verification.',
      visible: true,
      canonicalUrl: null,
      resumeProfileId: profile.id,
      tags: ['beta'],
      projectLinks: [
        { type: 'store', url: 'https://store.example.com/beta-seed', label: 'Store' },
        { type: 'github', url: 'https://github.com/example/beta-seed', label: 'GitHub' }
      ]
    }
  ];

  for (const project of projects) {
    await deleteBySlug('/api/projects', project.slug);
    const res = await request(`${apiUrl}/api/projects`, { method: 'POST' }, project);
    if (res.ok) {
      const created = await res.json();
      console.log(`Created seeded project: ${created.title} (${created.id})`);
    } else {
      console.warn(`Seed project creation failed for ${project.title}: ${res.status} ${await res.text()}`);
    }
  }

  console.log('Database seeded successfully!');
}

seed()
  .then(() => {
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
  });
