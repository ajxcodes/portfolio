"use client";

import { useState } from 'react';
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { DownloadIcon, XCircleIcon } from '@/components/icons';
import { ContactLinks, ContactInfo } from '@/components/ContactLinks';
import { SkillsSection } from '@/components/SkillsSection';

interface SkillGroup {
  category: string;
  items: string[];
}

interface Experience {
  company: string;
  role: string;
  period: string;
  results: string[];
  skills?: string[];
}

interface PreviousExperience {
  role: string;
  company: string;
  location: string;
  period: string;
}

interface ResumeData {
  summary: string;
  contact: ContactInfo;
  skills: SkillGroup[];
  experience: Experience[];
  previousExperience?: PreviousExperience[];
}

interface PersonalInfo {
  name: string;
  title: string;
}

interface ResumeClientPageProps {
  resume: ResumeData;
  personalInfo: PersonalInfo;
}

export const ResumeClientPage = ({ resume, personalInfo }: ResumeClientPageProps) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const handleSkillSelect = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleClearSkills = () => {
    setSelectedSkills([]);
  };

  return (
    <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-lg">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-10">
          <Avatar size={240} altText={personalInfo.name} />
        </div>
      </div>
      <div className="text-center border-b border-primary/20 pb-6 mb-6">
        <div className="flex justify-center items-center gap-4 mb-4">
          <h1 id="page-title" className="text-4xl font-bold text-primary">{personalInfo.name}</h1>
          <Link
            href="/ajxcodes-AlvinJorrelPascual-Resume.pdf"
            download="AlvinJorrelPascual-Resume.pdf"
            className="p-2 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Download Resume"
            title="Download Resume"
          >
            <DownloadIcon className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <div id="contact-links-section">
          <ContactLinks contact={resume.contact} />
        </div>
      </div>

      {/* Summary Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Summary</h2>
        <p className="text-lg text-balance whitespace-pre-wrap">{resume.summary}</p>
      </section>

      {/* Grouped Skills Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center border-b-2 border-primary/50 pb-2 mb-4">
          <h2 className="text-2xl font-bold text-primary">Skills</h2>
          {selectedSkills.length > 0 && (
            <button
              onClick={handleClearSkills}
              className="flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary/10"
            >
              <XCircleIcon className="h-4 w-4" />
              Clear ({selectedSkills.length})
            </button>
          )}
        </div>
        <SkillsSection
          skills={resume.skills}
          selectedSkills={selectedSkills}
          onSkillSelect={handleSkillSelect}
        />
      </section>

      {/* Experience Section (Timeline Style) */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Professional Experience</h2>
        <div className="relative border-l-2 border-primary/20 pl-8 space-y-10">
          {resume.experience.map((exp: Experience) => {
            const hasSelectedSkills = selectedSkills.length > 0;
            const isHighlighted = hasSelectedSkills && exp.skills?.some(s => selectedSkills.includes(s));
            const isDimmed = hasSelectedSkills && !isHighlighted;
            const matchingSkills = exp.skills?.filter(s => selectedSkills.includes(s)) ?? [];

            return (
              <div key={`${exp.company}-${exp.role}`} className={`relative transition-all duration-300 ease-in-out ${isHighlighted ? 'scale-105' : ''} ${isDimmed ? 'opacity-50 scale-95' : ''}`}>
                <div className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-card transition-colors duration-300 ${isHighlighted ? 'bg-primary' : 'bg-primary/20'}`}></div>
                <div className={`p-4 rounded-lg transition-all duration-300 ${isHighlighted ? 'bg-primary/10 ring-2 ring-primary/50' : ''}`}>
                  <h3 className="text-xl font-bold">{exp.role}</h3>
                  <p className="font-semibold text-primary/80">{exp.company}</p>
                  <p className="text-sm text-foreground/70 mb-2">{exp.period}</p>
                  <ul className="mt-2 list-disc list-inside space-y-2">
                    {exp.results.map((result, index) => (
                      <li key={index} className="text-balance">{result}</li>
                    ))}
                  </ul>
                  {isHighlighted && matchingSkills.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-primary/10">
                      <h4 className="text-sm font-semibold mb-2 text-primary/90">Matching Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchingSkills.map(skill => (
                          <span
                            key={skill}
                            className="matched-skill-tag"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Previous Experience Section */}
      {resume.previousExperience && resume.previousExperience.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-primary border-b-2 border-primary/50 pb-2 mb-4">Previous Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {resume.previousExperience.map((exp: PreviousExperience) => (
              <div key={`${exp.company}-${exp.role}`}>
                <h3 className="font-bold">{exp.role}</h3>
                <p className="text-sm text-foreground/80">{exp.company} - {exp.location}</p>
                <p className="text-xs text-foreground/60">{exp.period}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};