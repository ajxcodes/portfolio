import { renderHook, act } from "@testing-library/react";
import { useResumeForm } from "../useResumeForm";
import * as adminService from "@/lib/adminService";

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

  it("should support adding a new experience item with default values", async () => {
    const { result } = await renderAndResolveHook();
    
    act(() => {
      result.current.addExperience();
    });

    expect(result.current.experiences.length).toBe(1);
    const firstExp = result.current.experiences[0];
    expect(firstExp.company).toBe("");
    expect(firstExp.isCurrent).toBe(true);
    expect(firstExp.startMonth).toBe("Jan");
    expect(firstExp.period).toContain("Present");
  });

  it("should update experience details correctly when updateExperience is called", async () => {
    const { result } = await renderAndResolveHook();

    act(() => {
      result.current.addExperience();
    });

    act(() => {
      result.current.updateExperience(0, "company", "Google");
      result.current.updateExperience(0, "role", "SWE");
    });

    expect(result.current.experiences[0].company).toBe("Google");
    expect(result.current.experiences[0].role).toBe("SWE");
  });

  it("should atomically perform bulk updates via partial object parameter in updateExperience", async () => {
    const { result } = await renderAndResolveHook();

    act(() => {
      result.current.addExperience();
    });

    // Verify starting state
    expect(result.current.experiences[0].isCurrent).toBe(true);

    // Apply multiple updates atomically
    act(() => {
      result.current.updateExperience(0, {
        isCurrent: false,
        endMonth: "Dec",
        endYear: "2026",
        period: "Jan 2026 - Dec 2026",
      });
    });

    const exp = result.current.experiences[0];
    expect(exp.isCurrent).toBe(false);
    expect(exp.endMonth).toBe("Dec");
    expect(exp.endYear).toBe("2026");
    expect(exp.period).toBe("Jan 2026 - Dec 2026");
  });
});
