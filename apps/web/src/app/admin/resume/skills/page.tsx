"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseBrowser";
import { Plus, Trash2, Edit2, Check, X, AlertCircle, ChevronDown, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";

const lucideIconNames = Object.keys(LucideIcons).filter((name) => 
  !name.endsWith("Icon") && 
  name !== "createLucideIcon" && 
  name !== "default" &&
  name !== "LucideProps" &&
  (typeof (LucideIcons as any)[name] === "function" || typeof (LucideIcons as any)[name] === "object") &&
  name[0] === name[0].toUpperCase() // Only take PascalCase components
).sort();

function IconSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const SelectedIcon = value ? (LucideIcons as any)[value] : null;
  const filtered = lucideIconNames.filter(n => n.toLowerCase().includes(search.toLowerCase())).slice(0, 50);

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px] w-full sm:w-48"
      >
        <span className="flex items-center gap-2 truncate">
          {SelectedIcon ? <SelectedIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/50" />}
          <span className="truncate">{value || "No Icon"}</span>
        </span>
        <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 w-64 flex flex-col bg-card border border-primary/20 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-primary/10 flex items-center gap-2 bg-background/50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search icons..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm w-full"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              <div 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer text-sm"
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              >
                <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/50" />
                No Icon
              </div>
              {filtered.map(name => {
                const Icon = (LucideIcons as any)[name];
                return (
                  <div 
                    key={name}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer text-sm"
                    onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                  >
                    <Icon className="w-4 h-4" />
                    {name}
                  </div>
                );
              })}
              {filtered.length === 50 && (
                <div className="text-xs text-center text-muted-foreground p-2">
                  Type to see more...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface Skill {
  id: string;
  skillName: string;
  displayOrder: number;
}

interface SkillCategory {
  id: string;
  categoryName: string;
  iconName?: string;
  displayOrder: number;
  skills: Skill[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5808";

export default function SkillsLibraryPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCatId, setNewSkillCatId] = useState<string | null>(null);

  const fetchAuthHeaders = async () => {
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
  };

  const loadCategories = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills`, { headers });
      if (!res.ok) throw new Error("Failed to load skills");
      const data = await res.json();
      setCategories(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Error loading skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          categoryName: newCatName.trim(), 
          iconName: newCatIcon.trim() || undefined,
          displayOrder: categories.length 
        }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      setNewCatName("");
      setNewCatIcon("");
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      const cat = categories.find((c) => c.id === id);
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills/categories/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ 
          categoryName: editCatName.trim(), 
          iconName: editCatIcon.trim() || undefined,
          displayOrder: cat?.displayOrder || 0 
        }),
      });
      if (!res.ok) throw new Error("Failed to update category");
      setEditingCatId(null);
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All skills in it will be lost.")) return;
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills/categories/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete category");
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddSkill = async (categoryId: string) => {
    if (!newSkillName.trim()) return;
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const order = cat?.skills?.length || 0;
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills`, {
        method: "POST",
        headers,
        body: JSON.stringify({ categoryId, skillName: newSkillName.trim(), displayOrder: order }),
      });
      if (!res.ok) throw new Error("Failed to add skill");
      setNewSkillName("");
      setNewSkillCatId(null);
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/resume/skills/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete skill");
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">skills_library</h1>
          <p className="text-xs text-muted-foreground/85 mt-1">Manage skill categories and global skills available to link in your work experience.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Category */}
      <div className="terminal-card p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center">
        <IconSelect value={newCatIcon} onChange={setNewCatIcon} />
        <input
          type="text"
          placeholder="New Category Name (e.g. Frontend)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          className="w-full sm:flex-1 bg-background border border-primary/20 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCatName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-10 animate-pulse text-xs">Loading skills...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 text-xs">No skill categories created yet.</div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const RenderedIcon = category.iconName ? (LucideIcons as any)[category.iconName] : null;
            return (
            <div key={category.id} className="terminal-card rounded-xl">
              {/* Category Header */}
              <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-primary/10 rounded-t-[10px]">
                {editingCatId === category.id ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="relative">
                      <IconSelect value={editCatIcon} onChange={setEditCatIcon} />
                    </div>
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="bg-background border border-primary/30 rounded px-2 py-1 text-xs font-bold focus:outline-none min-w-[150px]"
                    />
                    <button onClick={() => handleUpdateCategory(category.id)} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCatId(null)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                      {RenderedIcon && <RenderedIcon className="w-4 h-4 text-primary" />}
                      {category.categoryName}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingCatId(category.id);
                        setEditCatName(category.categoryName);
                        setEditCatIcon(category.iconName || "");
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Skills List */}
              <div className="p-4 flex flex-wrap gap-2">
                {category.skills?.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded pl-3 pr-1 py-1 text-xs font-bold">
                    <span>{skill.skillName}</span>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-0.5 transition-colors"
                    >
                      <X className="w-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Skill Input */}
                {newSkillCatId === category.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Skill name..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSkill(category.id)}
                      className="bg-background border border-primary/30 rounded-l px-3 py-1 text-xs focus:outline-none w-32"
                    />
                    <button
                      onClick={() => handleAddSkill(category.id)}
                      className="bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 text-xs font-bold border border-l-0 border-primary/30 border-r-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setNewSkillCatId(null);
                        setNewSkillName("");
                      }}
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-2 py-1 rounded-r text-xs font-bold border border-destructive/30 border-l-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNewSkillCatId(category.id);
                      setNewSkillName("");
                    }}
                    className="flex items-center gap-1 border border-dashed border-primary/40 text-primary/80 hover:text-primary hover:bg-primary/5 rounded px-3 py-1 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Skill
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
