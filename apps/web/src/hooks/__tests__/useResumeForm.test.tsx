import { renderHook, act } from "@testing-library/react";
import { useResumeForm } from "../useResumeForm";
import * as adminService from "@/lib/adminService";
import { supabase } from "@/lib/supabaseBrowser";

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
  useSearchParams() {
    return {
      get: mockGet,
    };
  },
}));

// Mock adminService
jest.mock("@/lib/adminService", () => ({
  fetchProfile: jest.fn(),
  fetchSkills: jest.fn().mockResolvedValue([]),
  saveProfile: jest.fn(),
  createSkillInline: jest.fn(),
  uploadAvatar: jest.fn(),
  fetchGitHubUser: jest.fn(),
}));

// Mock supabase
jest.mock("@/lib/supabaseBrowser", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe("useResumeForm Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null); // default to profile creation
  });

  const renderAndResolveHook = async () => {
    let rendered: any;
    await act(async () => {
      rendered = renderHook(() => useResumeForm());
      // Wait for any async microtasks to flush
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return rendered;
  };

  it("should initialize with empty state on profile creation", async () => {
    const { result } = await renderAndResolveHook();

    expect(result.current.name).toBe("");
    expect(result.current.experiences).toEqual([]);
  });

  it("should load existing profile data on mount when profileId is present", async () => {
    mockGet.mockReturnValue("prof-123");
    const mockProfile = {
      name: "John Doe",
      title: "Staff Software Engineer",
      intro: "Intro text here",
      photoUrlLight: "http://light-pic",
      photoUrlDark: "http://dark-pic",
      links: [
        { linkType: { keyIdentifier: "email" }, url: "john@example.com" },
        { linkType: { keyIdentifier: "phone" }, url: "+123" },
        { linkType: { keyIdentifier: "website" }, url: "https://john.com" },
        { linkType: { keyIdentifier: "linkedin" }, url: "https://linkedin.com/in/john" },
        { linkType: { keyIdentifier: "calendar" }, url: "https://cal.com/john" },
        { linkType: { keyIdentifier: "github" }, url: "https://github.com/john" }
      ],
      workExperiences: [
        {
          id: "exp-1",
          company: "Acme Corp",
          role: "Developer",
          period: "Jan 2020 - Dec 2022",
          location: "San Francisco, CA",
          isPrevious: false,
          displayOrder: 0,
          highlights: [
            { displayOrder: 0, resultText: "Built things" }
          ],
          workExperienceSkills: [
            { skillId: "skill-1" }
          ]
        }
      ]
    };

    (adminService.fetchProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

    const { result } = await renderAndResolveHook();

    expect(result.current.name).toBe("John Doe");
    expect(result.current.title).toBe("Staff Software Engineer");
    expect(result.current.intro).toBe("Intro text here");
    expect(result.current.photoUrlLight).toBe("http://light-pic");
    expect(result.current.photoUrlDark).toBe("http://dark-pic");
    expect(result.current.email).toBe("john@example.com");
    expect(result.current.phone).toBe("+123");
    expect(result.current.website).toBe("https://john.com");
    expect(result.current.linkedinVal).toBe("https://linkedin.com/in/john");
    expect(result.current.calendar).toBe("https://cal.com/john");
    expect(result.current.githubVal).toBe("https://github.com/john");

    expect(result.current.experiences.length).toBe(1);
    expect(result.current.experiences[0]).toEqual(expect.objectContaining({
      id: "exp-1",
      company: "Acme Corp",
      role: "Developer",
      period: "Jan 2020 - Dec 2022",
      isCurrent: false,
      startMonth: "Jan",
      startYear: "2020",
      endMonth: "Dec",
      endYear: "2022",
      highlights: ["Built things"],
      skillIds: ["skill-1"]
    }));
  });

  it("should support adding, removing, and moving experiences", async () => {
    const { result } = await renderAndResolveHook();

    // 1. Add experience
    act(() => {
      result.current.addExperience();
    });
    expect(result.current.experiences.length).toBe(1);

    // 2. Add second experience
    act(() => {
      result.current.addExperience();
    });
    expect(result.current.experiences.length).toBe(2);

    act(() => {
      result.current.updateExperience(0, "company", "Company A");
      result.current.updateExperience(1, "company", "Company B");
    });

    // 3. Move experience down
    act(() => {
      result.current.moveExperience(0, "down");
    });
    expect(result.current.experiences[0].company).toBe("Company B");
    expect(result.current.experiences[1].company).toBe("Company A");

    // 4. Move experience up
    act(() => {
      result.current.moveExperience(1, "up");
    });
    expect(result.current.experiences[0].company).toBe("Company A");
    expect(result.current.experiences[1].company).toBe("Company B");

    // 5. Remove experience
    act(() => {
      result.current.removeExperience(0);
    });
    expect(result.current.experiences.length).toBe(1);
    expect(result.current.experiences[0].company).toBe("Company B");
  });

  it("should support adding, updating, and removing highlights", async () => {
    const { result } = await renderAndResolveHook();

    act(() => {
      result.current.addExperience();
    });

    // Add highlights
    act(() => {
      result.current.addHighlight(0);
    });
    expect(result.current.experiences[0].highlights.length).toBe(1);

    act(() => {
      result.current.updateHighlight(0, 0, "Amazing highlight");
    });
    expect(result.current.experiences[0].highlights[0]).toBe("Amazing highlight");

    act(() => {
      result.current.removeHighlight(0, 0);
    });
    expect(result.current.experiences[0].highlights.length).toBe(0);
  });

  it("should support syncing avatar via GitHub username successfully", async () => {
    (adminService.fetchGitHubUser as jest.Mock).mockResolvedValueOnce({
      avatar_url: "https://github-avatar.png",
    });

    const { result } = await renderAndResolveHook();

    act(() => {
      result.current.setGithubUser("test-user");
    });

    await act(async () => {
      await result.current.handleGithubSync();
    });

    expect(result.current.photoUrlLight).toBe("https://github-avatar.png");
    expect(result.current.photoUrlDark).toBe("https://github-avatar.png");
    expect(result.current.successMsg).toBe("Synced avatar picture from GitHub successfully!");
  });

  it("should support syncing avatar via active session metadata successfully", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          user_metadata: {
            avatar_url: "https://supabase-avatar.png",
          },
        },
      },
    });

    const { result } = await renderAndResolveHook();

    await act(async () => {
      await result.current.handleSessionSync();
    });

    expect(result.current.photoUrlLight).toBe("https://supabase-avatar.png");
    expect(result.current.photoUrlDark).toBe("https://supabase-avatar.png");
    expect(result.current.successMsg).toBe("Synced picture from Supabase session user metadata successfully!");
  });

  it("should support uploading light and dark theme profile pictures successfully", async () => {
    (adminService.uploadAvatar as jest.Mock).mockResolvedValueOnce({
      url: "https://uploaded-avatar.png",
    });

    const { result } = await renderAndResolveHook();

    const mockFile = new File(["dummy"], "avatar.png", { type: "image/png" });
    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent, "light");
    });

    expect(result.current.photoUrlLight).toBe("https://uploaded-avatar.png");
    expect(result.current.successMsg).toBe("Uploaded light theme profile picture successfully!");
  });

  it("should support inline skill creation and category injection", async () => {
    const mockCategories = [
      { id: "cat-1", name: "Languages", skills: [] }
    ];
    (adminService.fetchSkills as jest.Mock).mockResolvedValueOnce(mockCategories);
    (adminService.createSkillInline as jest.Mock).mockResolvedValueOnce({
      id: "skill-react",
      skillName: "React",
    });

    const { result } = await renderAndResolveHook();

    // Add experience
    act(() => {
      result.current.addExperience();
    });

    // Setup inline skill details
    act(() => {
      result.current.setNewSkillNameMap({ 0: "React" });
      result.current.setNewSkillCatMap({ 0: "cat-1" });
    });

    await act(async () => {
      await result.current.handleCreateSkillInline(0);
    });

    expect(result.current.experiences[0].skillIds).toContain("skill-react");
    expect(result.current.newSkillNameMap[0]).toBe("");
  });

  it("should submit the form and save the profile successfully", async () => {
    mockGet.mockReturnValue("prof-999");
    (adminService.saveProfile as jest.Mock).mockResolvedValueOnce({});

    const { result } = await renderAndResolveHook();

    act(() => {
      result.current.setName("Jane Doe");
      result.current.setTitle("Principal Architect");
      result.current.setIntro("Hello world");
      result.current.setEmail("jane@example.com");
      
      // Add experience and fill details
      result.current.addExperience();
    });

    act(() => {
      result.current.updateExperience(0, {
        company: "Meta",
        role: "Engineer",
        startMonth: "Jan",
        startYear: "2025",
        isCurrent: true,
      });
    });

    await act(async () => {
      const mockEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(mockEvent);
    });

    expect(adminService.saveProfile).toHaveBeenCalledWith(
      "prof-999",
      expect.objectContaining({
        name: "Jane Doe",
        title: "Principal Architect",
        intro: "Hello world",
        links: [
          { linkTypeName: "Email", linkTypeKey: "email", url: "jane@example.com" }
        ],
        workExperiences: [
          expect.objectContaining({
            company: "Meta",
            role: "Engineer",
            period: "Jan 2025 - Present",
          })
        ]
      })
    );
    expect(result.current.successMsg).toBe("Profile details saved successfully!");
  });
});
