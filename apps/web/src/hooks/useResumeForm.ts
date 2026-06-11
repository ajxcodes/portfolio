import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";
import { parsePeriod, formatPeriod } from "@/lib/resumePeriodUtils";
import {
  fetchProfile,
  fetchSkills,
  saveProfile,
  createSkillInline,
  uploadAvatar,
  fetchGitHubUser
} from "@/lib/adminService";

export interface ExperienceItem {
  id?: string;
  clientId?: string;
  company: string;
  role: string;
  period: string;
  location: string;
  isPrevious: boolean;
  displayOrder: number;
  highlights: string[];
  startMonth?: string;
  startYear?: string;
  isCurrent?: boolean;
  endMonth?: string;
  endYear?: string;
  skillIds?: string[];
}

export function useResumeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("id");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [photoUrlLight, setPhotoUrlLight] = useState("");
  const [photoUrlDark, setPhotoUrlDark] = useState("");

  // Contacts
  const [email, setEmail] = useState("");
  const [emailHeader, setEmailHeader] = useState(true);
  const [phone, setPhone] = useState("");
  const [phoneHeader, setPhoneHeader] = useState(true);
  const [website, setWebsite] = useState("");
  const [websiteHeader, setWebsiteHeader] = useState(true);
  const [linkedinVal, setLinkedinVal] = useState("");
  const [linkedinHeader, setLinkedinHeader] = useState(true);
  const [calendar, setCalendar] = useState("");
  const [calendarHeader, setCalendarHeader] = useState(true);
  const [githubVal, setGithubVal] = useState("");
  const [githubHeader, setGithubHeader] = useState(true);
  const [instagramVal, setInstagramVal] = useState("");
  const [instagramHeader, setInstagramHeader] = useState(true);

  // Experiences & categories
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // Inline Skill Creation state
  const [newSkillNameMap, setNewSkillNameMap] = useState<Record<number, string>>({});
  const [newSkillCatMap, setNewSkillCatMap] = useState<Record<number, string>>({});

  const [githubUser, setGithubUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        if (profileId) {
          const data = await fetchProfile(profileId);
          setName(data.name || "");
          setTitle(data.title || "");
          setIntro(data.intro || "");
          setPhotoUrlLight(data.photoUrlLight || "");
          setPhotoUrlDark(data.photoUrlDark || "");

          // Links mapping
          if (data.links) {
            data.links.forEach((l: any) => {
              const key = l.linkType?.keyIdentifier || l.linkType?.name?.toLowerCase();
              const setters: Record<string, [React.Dispatch<React.SetStateAction<string>>, React.Dispatch<React.SetStateAction<boolean>>]> = {
                email: [setEmail, setEmailHeader],
                phone: [setPhone, setPhoneHeader],
                website: [setWebsite, setWebsiteHeader],
                linkedin: [setLinkedinVal, setLinkedinHeader],
                calendar: [setCalendar, setCalendarHeader],
                github: [setGithubVal, setGithubHeader],
                instagram: [setInstagramVal, setInstagramHeader]
              };
              if (key && setters[key]) {
                const [setUrl, setHeader] = setters[key];
                setUrl(l.url || "");
                setHeader(l.displayInHeader !== false);
              }
            });
          }

          // Experiences mapping
          if (data.workExperiences) {
            const sortedExps = [...data.workExperiences].sort((a, b) => a.displayOrder - b.displayOrder);
            setExperiences(
              sortedExps.map((we: any) => {
                const parsed = parsePeriod(we.period || "");
                return {
                  id: we.id,
                  clientId: we.id || Math.random().toString(36).substring(2, 9),
                  company: we.company || "",
                  role: we.role || "",
                  period: we.period || "",
                  location: we.location || "",
                  isPrevious: we.isPrevious || false,
                  displayOrder: we.displayOrder || 0,
                  highlights: we.highlights 
                    ? [...we.highlights].sort((a, b) => a.displayOrder - b.displayOrder).map((h: any) => h.resultText)
                    : [],
                  skillIds: we.workExperienceSkills ? we.workExperienceSkills.map((wes: any) => wes.skillId) : [],
                  ...parsed
                };
              })
            );
          }
        }

        // Fetch skills categories
        const skillsData = await fetchSkills();
        setAvailableCategories(skillsData || []);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load profile details.");
      } finally {
        setFetchLoading(false);
      }
    };

    loadData();
  }, [profileId]);

  const handleGithubSync = async () => {
    if (!githubUser) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const data = await fetchGitHubUser(githubUser);
      if (data.avatar_url) {
        setPhotoUrlLight(data.avatar_url);
        setPhotoUrlDark(data.avatar_url);
        setSuccessMsg("Synced avatar picture from GitHub successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync picture from GitHub.");
    }
  };

  const handleSessionSync = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH === "true") {
        throw new Error("Session sync is unavailable in Auth Bypass Local Dev mode.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No active user session found.");
      }

      const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (avatar) {
        setPhotoUrlLight(avatar);
        setPhotoUrlDark(avatar);
        setSuccessMsg("Synced picture from Supabase session user metadata successfully!");
      } else {
        throw new Error("Active user session has no profile picture metadata configured.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync picture from session metadata.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "light" | "dark") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const data = await uploadAvatar(file);
      if (target === "light") {
        setPhotoUrlLight(data.url);
      } else {
        setPhotoUrlDark(data.url);
      }
      setSuccessMsg(`Uploaded ${target} theme profile picture successfully!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  // Experience changes handlers
  const addExperience = () => {
    const defaultStartMonth = "Jan";
    const defaultStartYear = String(new Date().getFullYear());
    setExperiences([
      ...experiences,
      {
        clientId: Math.random().toString(36).substring(2, 9),
        company: "",
        role: "",
        period: `${defaultStartMonth} ${defaultStartYear} - Present`,
        location: "",
        isPrevious: false,
        displayOrder: experiences.length,
        highlights: [],
        startMonth: defaultStartMonth,
        startYear: defaultStartYear,
        isCurrent: true,
        endMonth: "",
        endYear: "",
        skillIds: []
      }
    ]);
  };

  const removeExperience = (index: number) => {
    const next = experiences.filter((_, idx) => idx !== index).map((exp, idx) => ({
      ...exp,
      displayOrder: idx
    }));
    setExperiences(next);
  };

  const moveExperience = (index: number, direction: "up" | "down") => {
    const next = [...experiences];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= experiences.length) return;
    
    // Swap displayOrder
    const tempOrder = next[index].displayOrder;
    next[index].displayOrder = next[targetIdx].displayOrder;
    next[targetIdx].displayOrder = tempOrder;

    // Swap position in array
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    setExperiences(next);
  };

  function updateExperience<K extends keyof ExperienceItem>(
    index: number,
    field: K,
    value: ExperienceItem[K]
  ): void;
  function updateExperience(
    index: number,
    updates: Partial<ExperienceItem>
  ): void;
  function updateExperience<K extends keyof ExperienceItem>(
    index: number,
    fieldOrUpdates: K | Partial<ExperienceItem>,
    value?: ExperienceItem[K]
  ) {
    setExperiences((prev) => {
      const next = [...prev];
      if (typeof fieldOrUpdates === "object" && fieldOrUpdates !== null) {
        next[index] = { ...next[index], ...fieldOrUpdates };
      } else {
        next[index] = { ...next[index], [fieldOrUpdates]: value } as ExperienceItem;
      }
      return next;
    });
  }

  const addHighlight = (expIndex: number) => {
    const next = [...experiences];
    next[expIndex].highlights = [...next[expIndex].highlights, ""];
    setExperiences(next);
  };

  const removeHighlight = (expIndex: number, hIndex: number) => {
    const next = [...experiences];
    next[expIndex].highlights = next[expIndex].highlights.filter((_, idx) => idx !== hIndex);
    setExperiences(next);
  };

  const updateHighlight = (expIndex: number, hIndex: number, val: string) => {
    const next = [...experiences];
    next[expIndex].highlights[hIndex] = val;
    setExperiences(next);
  };

  const handleCreateSkillInline = async (expIndex: number) => {
    const skillName = newSkillNameMap[expIndex]?.trim();
    const catId = newSkillCatMap[expIndex];
    if (!skillName || !catId) return;

    try {
      const newSkill = await createSkillInline(catId, skillName);
      
      // Update categories
      const nextCats = [...availableCategories];
      const catIndex = nextCats.findIndex(c => c.id === catId);
      if (catIndex !== -1) {
        if (!nextCats[catIndex].skills) nextCats[catIndex].skills = [];
        nextCats[catIndex].skills.push(newSkill);
        setAvailableCategories(nextCats);
      }

      // Add to experience
      const nextExps = [...experiences];
      const currentSkills = nextExps[expIndex].skillIds || [];
      if (!currentSkills.includes(newSkill.id)) {
        nextExps[expIndex].skillIds = [...currentSkills, newSkill.id];
        setExperiences(nextExps);
      }

      // Clear inline form
      setNewSkillNameMap({ ...newSkillNameMap, [expIndex]: "" });
      setNewSkillCatMap({ ...newSkillCatMap, [expIndex]: "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Error creating skill");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const linksList = [];
    if (email) linksList.push({ linkTypeName: "Email", linkTypeKey: "email", url: email, displayInHeader: emailHeader });
    if (phone) linksList.push({ linkTypeName: "Phone", linkTypeKey: "phone", url: phone, displayInHeader: phoneHeader });
    if (website) linksList.push({ linkTypeName: "Website", linkTypeKey: "website", url: website, displayInHeader: websiteHeader });
    if (linkedinVal) linksList.push({ linkTypeName: "LinkedIn", linkTypeKey: "linkedin", url: linkedinVal, displayInHeader: linkedinHeader });
    if (calendar) linksList.push({ linkTypeName: "Calendar", linkTypeKey: "calendar", url: calendar, displayInHeader: calendarHeader });
    if (githubVal) linksList.push({ linkTypeName: "GitHub", linkTypeKey: "github", url: githubVal, displayInHeader: githubHeader });
    if (instagramVal) linksList.push({ linkTypeName: "Instagram", linkTypeKey: "instagram", url: instagramVal, displayInHeader: instagramHeader });

    const payload = {
      name,
      title,
      intro,
      photoUrlLight: photoUrlLight || undefined,
      photoUrlDark: photoUrlDark || undefined,
      links: linksList,
      workExperiences: experiences.map((exp) => {
        const periodStr = formatPeriod(
          exp.startMonth || "",
          exp.startYear || "",
          !!exp.isCurrent,
          exp.endMonth || "",
          exp.endYear || ""
        ) || exp.period;
        return {
          id: exp.id,
          company: exp.company,
          role: exp.role,
          period: periodStr,
          location: exp.location,
          isPrevious: exp.isPrevious,
          displayOrder: exp.displayOrder,
          highlights: exp.highlights.filter(h => h.trim() !== ""),
          skillIds: exp.skillIds || []
        };
      })
    };

    try {
      await saveProfile(profileId, payload);
      setSuccessMsg("Profile details saved successfully!");
      router.refresh();
      setTimeout(() => {
        router.push("/admin/resume");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the profile.");
      setLoading(false);
    }
  };

  return {
    profileId,
    name,
    setName,
    title,
    setTitle,
    intro,
    setIntro,
    photoUrlLight,
    setPhotoUrlLight,
    photoUrlDark,
    setPhotoUrlDark,
    email, setEmail, emailHeader, setEmailHeader,
    phone, setPhone, phoneHeader, setPhoneHeader,
    website, setWebsite, websiteHeader, setWebsiteHeader,
    linkedinVal, setLinkedinVal, linkedinHeader, setLinkedinHeader,
    calendar, setCalendar, calendarHeader, setCalendarHeader,
    githubVal, setGithubVal, githubHeader, setGithubHeader,
    instagramVal, setInstagramVal, instagramHeader, setInstagramHeader,
    experiences,
    availableCategories,
    newSkillNameMap,
    setNewSkillNameMap,
    newSkillCatMap,
    setNewSkillCatMap,
    githubUser,
    setGithubUser,
    loading,
    fetchLoading,
    errorMsg,
    successMsg,
    handleGithubSync,
    handleSessionSync,
    handleFileUpload,
    addExperience,
    removeExperience,
    moveExperience,
    updateExperience,
    addHighlight,
    removeHighlight,
    updateHighlight,
    handleCreateSkillInline,
    handleSubmit
  };
}
