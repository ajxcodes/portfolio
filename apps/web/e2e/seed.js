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
  const skillIds = [];
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
          skillIds.push(skill.id);
        } else {
          console.warn(`Skill creation failed for ${skillName}: ${skillRes.status}`);
        }
      } catch (e) {
        console.warn(`Error creating skill ${skillName}:`, e);
      }
    }
  }

  // 3. Create a resume profile (links are enough for the test; work experiences are optional)
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

  // 5. Fetch the newly activated profile to retrieve link IDs
  const profileDetailsRes = await request(`${apiUrl}/api/resume/${profile.id}`, { method: 'GET' });
  if (profileDetailsRes.ok) {
    const profileDetails = await profileDetailsRes.json();
    console.log('Profile links with IDs:', profileDetails.links);
  } else {
    console.warn('Could not fetch profile details after activation');
  }

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
