const http = require('http');
const { randomUUID } = require('crypto');

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5808';

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

async function seed() {
  console.log(`Seeding database via API at ${apiUrl}...`);

  // 1. Create skill category
  const catRes = await request(`${apiUrl}/api/resume/skills/categories`, {
    method: 'POST'
  }, {
    categoryName: "Languages & Frameworks",
    iconName: "CodeIcon",
    displayOrder: 1
  });

  if (!catRes.ok) {
    throw new Error(`Failed to create skill category: ${catRes.status} ${await catRes.text()}`);
  }

  const category = await catRes.json();
  console.log(`Created skill category: ${category.id}`);

  // 2. Create skills
  const skillsToCreate = ["TypeScript", "React", "C#", ".NET"];
  const skillIds = [];

  for (let i = 0; i < skillsToCreate.length; i++) {
    const skillName = skillsToCreate[i];
    const skillRes = await request(`${apiUrl}/api/resume/skills`, {
      method: 'POST'
    }, {
      categoryId: category.id,
      skillName,
      displayOrder: i + 1
    });

    if (!skillRes.ok) {
      throw new Error(`Failed to create skill ${skillName}: ${skillRes.status} ${await skillRes.text()}`);
    }

    const skill = await skillRes.json();
    console.log(`Created skill: ${skillName} (${skill.id})`);
    skillIds.push(skill.id);
  }

  // 3. Create a resume profile with work experiences referencing the skill IDs
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
    ],
    workExperiences: [
      {
        company: "Test Company",
        role: "Developer",
        period: "2020 - Present",
        location: "Remote",
        isPrevious: false,
        displayOrder: 1,
        highlights: ["Built awesome features"],
        skillIds: [skillIds[0], skillIds[1]] // TypeScript and React
      }
    ]
  });

  if (!profileRes.ok) {
    throw new Error(`Failed to create resume profile: ${profileRes.status} ${await profileRes.text()}`);
  }

  const profile = await profileRes.json();
  console.log(`Created profile: ${profile.id}`);

  // 4. Activate the profile
  const activateRes = await request(`${apiUrl}/api/resume/${profile.id}/activate`, {
    method: 'POST'
  });

  if (!activateRes.ok) {
    throw new Error(`Failed to activate resume profile: ${activateRes.status} ${await activateRes.text()}`);
  }
  console.log(`Activated profile: ${profile.id}`);

  console.log("Database seeded successfully!");
}

seed()
  .then(() => {
    console.log("Seeding completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal seeding error:", err);
    process.exit(1);
  });
