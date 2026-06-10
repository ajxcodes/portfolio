const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5808';

async function seed() {
  console.log(`Seeding database via API at ${apiUrl}...`);

  try {
    // 1. Create skill category
    const catRes = await fetch(`${apiUrl}/api/resume/skills/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryName: "Languages & Frameworks",
        iconName: "CodeIcon",
        displayOrder: 1
      })
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
      const skillRes = await fetch(`${apiUrl}/api/resume/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          skillName,
          displayOrder: i + 1
        })
      });

      if (!skillRes.ok) {
        throw new Error(`Failed to create skill ${skillName}: ${skillRes.status} ${await skillRes.text()}`);
      }
      
      const skill = await skillRes.json();
      console.log(`Created skill: ${skillName} (${skill.id})`);
      skillIds.push(skill.id);
    }

    // 3. Create a resume profile with work experiences referencing the skill IDs
    const profileRes = await fetch(`${apiUrl}/api/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });

    if (!profileRes.ok) {
      throw new Error(`Failed to create resume profile: ${profileRes.status} ${await profileRes.text()}`);
    }

    const profile = await profileRes.json();
    console.log(`Created profile: ${profile.id}`);

    // 4. Activate the profile
    const activateRes = await fetch(`${apiUrl}/api/resume/${profile.id}/activate`, {
      method: 'POST'
    });

    if (!activateRes.ok) {
      throw new Error(`Failed to activate resume profile: ${activateRes.status} ${await activateRes.text()}`);
    }
    console.log(`Activated profile: ${profile.id}`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
