"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Github, 
  User, 
  AlertCircle,
  CheckCircle2,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Calendar,
  Briefcase,
  X,
  ChevronDown,
  ChevronUp,
  Instagram
} from "lucide-react";

import { useResumeForm, ExperienceItem } from "@/hooks/useResumeForm";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { ExistingSkillSelect } from "@/components/admin/ExistingSkillSelect";
import { ProfileSkeleton } from "@/components/admin/ProfileSkeleton";
import { MONTHS, YEARS, formatPeriod, calculateDuration } from "@/lib/resumePeriodUtils";

function ResumeFormContent() {
  const {
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
    email,
    setEmail,
    phone,
    setPhone,
    website,
    setWebsite,
    linkedinVal,
    setLinkedinVal,
    calendar,
    setCalendar,
    githubVal,
    setGithubVal,
    instagramVal,
    setInstagramVal,
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
  } = useResumeForm();

  const [collapsedJobs, setCollapsedJobs] = useState<Record<string, boolean>>({});

  const allCollapsed = experiences.length > 0 && experiences.every(exp => collapsedJobs[exp.clientId || ""]);

  const toggleAllJobs = () => {
    if (allCollapsed) {
      setCollapsedJobs({});
    } else {
      const next: Record<string, boolean> = {};
      experiences.forEach(exp => {
        if (exp.clientId) {
          next[exp.clientId] = true;
        }
      });
      setCollapsedJobs(next);
    }
  };

  if (fetchLoading) {
    return <ProfileSkeleton />;
  }

  const allSkillsFlat = availableCategories.flatMap(c => c.skills || []);
  const allSkillsMap = Object.fromEntries(allSkillsFlat.map(s => [s.id, s]));

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-20 relative font-mono text-xs">
      {/* Sticky top action bar */}
      <div className="sticky top-0 bg-background/85 backdrop-blur-md z-30 py-4 border-b border-primary/10 flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/resume" 
            className="p-2 border border-primary/20 hover:bg-primary/5 rounded transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">
              {profileId ? "edit_profile" : "create_profile"}
            </h1>
            <p className="hidden md:block text-muted-foreground/80 text-[10px] mt-0.5">
              Configure header fields, contact details, and experiences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Main Details Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-3">
            <User className="w-4 h-4" />
            Personal Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="AJX"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                Professional Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="Lead Software Engineer"
              />
            </div>
          </div>

          <div>
            <label htmlFor="intro" className="block text-[10px] font-bold uppercase tracking-wider mb-2">
              Introductory Lead Paragraph
            </label>
            <textarea
              id="intro"
              rows={4}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs resize-none"
              placeholder="A brief summary of your expertise and experience..."
            />
          </div>

          <div className="border-t border-primary/10 pt-6 mt-6 space-y-6">
            <h3 className="text-xs font-bold text-foreground/90">Profile Picture Sync</h3>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="githubUser" className="block text-[10px] font-bold uppercase tracking-wider mb-2">
                  GitHub Username
                </label>
                <input
                  id="githubUser"
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                  placeholder="ajxcodes"
                />
              </div>
              <button
                type="button"
                onClick={handleGithubSync}
                className="w-full sm:w-auto px-4 py-2 bg-primary/5 border border-primary/20 hover:bg-primary/10 text-xs font-bold rounded-md flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                Sync GitHub Pic
              </button>
            </div>

            {process.env.NEXT_PUBLIC_LOCAL_DEV_BYPASS_AUTH !== "true" && (
              <button
                type="button"
                onClick={handleSessionSync}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 hover:bg-primary/10 text-xs font-bold rounded-md flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Sync Active Session Pic
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="photoUrlLight" className="block text-[10px] font-bold uppercase tracking-wider">
                  Light Theme Photo URL
                </label>
                <input
                  id="photoUrlLight"
                  type="text"
                  value={photoUrlLight}
                  onChange={(e) => setPhotoUrlLight(e.target.value)}
                  className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 border border-primary/20 hover:bg-primary/5 text-xs font-bold rounded flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Light Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "light")}
                      className="hidden"
                    />
                  </label>
                  {photoUrlLight && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={photoUrlLight} 
                      alt="Light Theme Preview" 
                      className="w-8 h-8 rounded-full object-cover border border-primary/20 bg-background"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="photoUrlDark" className="block text-[10px] font-bold uppercase tracking-wider">
                  Dark Theme Photo URL
                </label>
                <input
                  id="photoUrlDark"
                  type="text"
                  value={photoUrlDark}
                  onChange={(e) => setPhotoUrlDark(e.target.value)}
                  className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 border border-primary/20 hover:bg-primary/5 text-xs font-bold rounded flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Dark Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "dark")}
                      className="hidden"
                    />
                  </label>
                  {photoUrlDark && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={photoUrlDark} 
                      alt="Dark Theme Preview" 
                      className="w-8 h-8 rounded-full object-cover border border-primary/20 bg-background"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Links Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-3">
            <Mail className="w-4 h-4" />
            Contact & Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="mail@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="+1 234 567 890"
              />
            </div>

            <div>
              <label htmlFor="website" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Personal Website
              </label>
              <input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="linkedinVal" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />
                LinkedIn Profile URL
              </label>
              <input
                id="linkedinVal"
                type="text"
                value={linkedinVal}
                onChange={(e) => setLinkedinVal(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label htmlFor="calendar" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Calendar Scheduling Link
              </label>
              <input
                id="calendar"
                type="text"
                value={calendar}
                onChange={(e) => setCalendar(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="https://cal.com/username"
              />
            </div>

            <div>
              <label htmlFor="githubVal" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Github className="w-3.5 h-3.5 text-muted-foreground" />
                GitHub Profile URL
              </label>
              <input
                id="githubVal"
                type="text"
                value={githubVal}
                onChange={(e) => setGithubVal(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label htmlFor="instagramVal" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                Instagram Profile URL
              </label>
              <input
                id="instagramVal"
                type="text"
                value={instagramVal}
                onChange={(e) => setInstagramVal(e.target.value)}
                className="w-full px-4 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                placeholder="https://instagram.com/username"
              />
            </div>
          </div>
        </div>

        {/* Work Experiences Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <div className="flex justify-between items-center border-b border-primary/10 pb-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Work Experiences
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:opacity-90 text-white text-[10px] font-bold rounded transition-all shadow"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              {experiences.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllJobs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded transition-all"
                >
                  {allCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Expand All
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Collapse All
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Job
              </button>
            </div>
          </div>

          {experiences.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground/80 py-8">
              No work experiences configured. Click "Add Job" to define one.
            </p>
          ) : (
            <div className="space-y-6">
              {experiences.map((exp, index) => {
                const isCollapsed = !!collapsedJobs[exp.clientId || ""];
                return (
                  <div 
                    key={exp.clientId || index}
                    className={`p-5 border border-primary/20 bg-primary/5 rounded-md transition-all ${
                      isCollapsed ? "py-3 space-y-0" : "space-y-4"
                    }`}
                  >
                    {/* Header Bar */}
                    <div 
                      className={`flex justify-between items-center rounded ${
                        !isCollapsed ? "border-b border-primary/10 pb-3 mb-2" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (exp.clientId) {
                            setCollapsedJobs(prev => ({
                              ...prev,
                              [exp.clientId!]: !prev[exp.clientId!]
                            }));
                          }
                        }}
                        aria-expanded={!isCollapsed}
                        aria-controls={`exp-panel-${exp.clientId || index}`}
                        className="flex items-center gap-2 flex-1 min-w-0 mr-4 text-left hover:bg-primary/5 transition-all rounded p-1.5 -ml-1.5 select-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-xs text-foreground/80 truncate">
                          {exp.company || exp.role ? (
                            <>
                              <span className="text-primary font-bold">{exp.company || "Untitled Company"}</span>
                              {exp.role && <span className="text-muted-foreground"> — {exp.role}</span>}
                              {exp.period && <span className="text-muted-foreground/60 text-[10px] ml-2 font-normal">({exp.period})</span>}
                            </>
                          ) : (
                            "New Job Details"
                          )}
                        </h3>
                      </button>

                      {/* Actions Bar */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveExperience(index, "up")}
                          className="p-1.5 border border-primary/20 hover:bg-primary/10 rounded-md text-muted-foreground disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === experiences.length - 1}
                          onClick={() => moveExperience(index, "down")}
                          className="p-1.5 border border-primary/20 hover:bg-primary/10 rounded-md text-muted-foreground disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="p-1.5 border border-destructive/20 hover:bg-destructive/10 rounded-md text-destructive ml-2 focus:outline-none focus:ring-1 focus:ring-destructive/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div id={`exp-panel-${exp.clientId || index}`} className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, "company", e.target.value)}
                              required
                              className="w-full px-3 py-2 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                              placeholder="Google"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                              Role / Title
                            </label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => updateExperience(index, "role", e.target.value)}
                              required
                              className="w-full px-3 py-2 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                              placeholder="Senior Software Engineer"
                            />
                          </div>

                          {/* Month/Year Range Picker */}
                          <div className="col-span-1 sm:col-span-2 bg-primary/5 p-4 rounded-md border border-primary/20 space-y-3 mt-1">
                            <div className="flex justify-between items-center">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Employment Period
                              </label>
                              {exp.startYear && (
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded animate-pulse border border-primary/20">
                                  Duration: {calculateDuration(
                                    exp.startMonth || "",
                                    exp.startYear || "",
                                    !!exp.isCurrent,
                                    exp.endMonth || "",
                                    exp.endYear || ""
                                  ) || "N/A"}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                              {/* Start Date */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Start Date</label>
                                <div className="flex gap-2">
                                  <select
                                    value={exp.startMonth}
                                    onChange={(e) => {
                                      const m = e.target.value;
                                      const nextPeriod = formatPeriod(m, exp.startYear || "", !!exp.isCurrent, exp.endMonth || "", exp.endYear || "");
                                      updateExperience(index, { startMonth: m, period: nextPeriod });
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  >
                                    <option value="">Month</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select
                                    value={exp.startYear}
                                    onChange={(e) => {
                                      const y = e.target.value;
                                      const nextPeriod = formatPeriod(exp.startMonth || "", y, !!exp.isCurrent, exp.endMonth || "", exp.endYear || "");
                                      updateExperience(index, { startYear: y, period: nextPeriod });
                                    }}
                                    required
                                    className="flex-1 px-2.5 py-1.5 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  >
                                    <option value="">Year</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* End Date */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">End Date</label>
                                <div className="flex gap-2">
                                  <select
                                    disabled={exp.isCurrent}
                                    value={exp.isCurrent ? "" : exp.endMonth}
                                    onChange={(e) => {
                                      const m = e.target.value;
                                      const nextPeriod = formatPeriod(exp.startMonth || "", exp.startYear || "", !!exp.isCurrent, m, exp.endYear || "");
                                      updateExperience(index, { endMonth: m, period: nextPeriod });
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-background border border-primary/20 rounded-md text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  >
                                    <option value="">Month</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <select
                                    disabled={exp.isCurrent}
                                    required={!exp.isCurrent}
                                    value={exp.isCurrent ? "" : exp.endYear}
                                    onChange={(e) => {
                                      const y = e.target.value;
                                      const nextPeriod = formatPeriod(exp.startMonth || "", exp.startYear || "", !!exp.isCurrent, exp.endMonth || "", y);
                                      updateExperience(index, { endYear: y, period: nextPeriod });
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-background border border-primary/20 rounded-md text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  >
                                    <option value="">Year</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Current Checkbox */}
                              <div className="pb-1.5 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`current-job-${index}`}
                                  checked={!!exp.isCurrent}
                                  onChange={(e) => {
                                    const curr = e.target.checked;
                                    const nextPeriod = formatPeriod(exp.startMonth || "", exp.startYear || "", curr, exp.endMonth || "", exp.endYear || "");
                                    const updates: Partial<ExperienceItem> = {
                                      isCurrent: curr,
                                      period: nextPeriod
                                    };
                                    if (curr) {
                                      updates.endMonth = "";
                                      updates.endYear = "";
                                    }
                                    updateExperience(index, updates);
                                  }}
                                  className="w-4 h-4 text-primary focus:ring-primary bg-background border border-primary/10 rounded cursor-pointer"
                                />
                                <label htmlFor={`current-job-${index}`} className="text-xs font-bold text-foreground/80 cursor-pointer select-none">
                                  I currently work here
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                              Location (Optional)
                            </label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => updateExperience(index, "location", e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                              placeholder="Remote / New York, NY"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id={`prev-${index}`}
                            checked={exp.isPrevious}
                            onChange={(e) => updateExperience(index, "isPrevious", e.target.checked)}
                            className="w-4 h-4 text-primary focus:ring-primary bg-background border border-primary/10 rounded"
                          />
                          <label htmlFor={`prev-${index}`} className="text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                            Mark as Previous Experience (shows in summary section instead of primary timeline)
                          </label>
                        </div>

                        {/* Highlights Sub-section */}
                        <div className="border-t border-primary/10 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Highlights & Achievements
                            </label>
                            <button
                              type="button"
                              onClick={() => addHighlight(index)}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Bullet
                            </button>
                          </div>

                          {exp.highlights.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">
                              No highlights. Click "Add Bullet" to add achievements.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {exp.highlights.map((highlight, hIndex) => (
                                <div key={hIndex} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={highlight}
                                    onChange={(e) => updateHighlight(index, hIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-background border border-primary/20 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    placeholder="Describe a key achievement or responsibility..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeHighlight(index, hIndex)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md focus:outline-none focus:ring-1 focus:ring-destructive/40"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Skills Sub-section */}
                        <div className="border-t border-primary/10 pt-4 space-y-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Skills Used
                          </label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(exp.skillIds || []).map(id => {
                               const skill = allSkillsMap[id];
                               if (!skill) return null;
                               return (
                                 <span key={id} className="bg-primary/5 text-foreground/80 text-xs px-2.5 py-1 rounded flex items-center gap-1 font-bold border border-primary/20">
                                   {skill.skillName}
                                   <button
                                     type="button"
                                     onClick={() => {
                                       const nextSkills = (exp.skillIds || []).filter(sid => sid !== id);
                                       updateExperience(index, "skillIds", nextSkills);
                                     }}
                                     className="hover:text-destructive transition-colors pl-1 focus:outline-none focus:ring-1 focus:ring-destructive/40"
                                   >
                                     <X className="w-3 h-3" />
                                   </button>
                                 </span>
                               );
                            })}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 items-center p-3 bg-background border border-primary/20 rounded-md">
                            <ExistingSkillSelect 
                              categories={availableCategories}
                              addedSkillIds={exp.skillIds || []}
                              onSelect={(val) => {
                                const currSkills = exp.skillIds || [];
                                if (!currSkills.includes(val)) {
                                  updateExperience(index, "skillIds", [...currSkills, val]);
                                }
                              }}
                            />

                            <span className="text-[10px] font-bold text-muted-foreground">OR CREATE NEW</span>

                            <div className="flex w-full sm:w-auto flex-1 items-center gap-1">
                              <input
                                type="text"
                                placeholder="Skill name..."
                                value={newSkillNameMap[index] || ""}
                                onChange={(e) => setNewSkillNameMap({ ...newSkillNameMap, [index]: e.target.value })}
                                className="w-full px-2 py-2 bg-primary/5 border border-primary/20 rounded-l-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 min-w-[100px]"
                              />
                              <CategorySelect
                                value={newSkillCatMap[index] || ""}
                                onChange={(val) => setNewSkillCatMap({ ...newSkillCatMap, [index]: val })}
                                categories={availableCategories}
                              />
                              <button
                                type="button"
                                onClick={() => handleCreateSkillInline(index)}
                                disabled={!newSkillNameMap[index]?.trim() || !newSkillCatMap[index]}
                                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-r-md disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-all mt-8"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function ResumeFormPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 animate-pulse text-muted-foreground">Loading form configuration...</div>}>
      <ResumeFormContent />
    </Suspense>
  );
}
