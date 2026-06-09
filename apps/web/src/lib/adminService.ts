import { supabase } from "@/lib/supabaseBrowser";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

export async function fetchAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH !== "true") {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  }
  return headers;
}

export async function fetchProfile(profileId: string) {
  const headers = await fetchAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/resume/${profileId}`, { headers });
  if (!res.ok) {
    throw new Error(`Profile not found or error loading data (${res.status})`);
  }
  return res.json();
}

export async function fetchSkills() {
  const headers = await fetchAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/resume/skills`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load skills catalogs (${res.status})`);
  }
  return res.json();
}

export async function saveProfile(profileId: string | null, payload: any) {
  const headers = await fetchAuthHeaders();
  const url = profileId 
    ? `${API_BASE_URL}/api/resume/${profileId}`
    : `${API_BASE_URL}/api/resume`;
  const method = profileId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Failed to save profile details (${res.status})`);
  }
  return res.json();
}

export async function createSkillInline(categoryId: string, skillName: string) {
  const headers = await fetchAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/resume/skills`, {
    method: "POST",
    headers,
    body: JSON.stringify({ categoryId, skillName, displayOrder: 0 }),
  });
  if (!res.ok) throw new Error("Failed to create skill");
  return res.json();
}

export async function uploadAvatar(file: File) {
  const authHeaders = await fetchAuthHeaders();
  delete authHeaders["Content-Type"];

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchGitHubUser(githubUser: string) {
  const res = await fetch(`https://api.github.com/users/${githubUser}`);
  if (!res.ok) {
    throw new Error(`GitHub user "${githubUser}" not found.`);
  }
  return res.json();
}
