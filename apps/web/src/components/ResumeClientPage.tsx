"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { DownloadIcon, XCircleIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, BriefcaseIcon, LinkIcon, GraduationCapIcon } from '@/components/icons';
import { ContactLinks } from '@/components/ContactLinks';
import { SkillsSection } from '@/components/SkillsSection';
import { ExperienceItem } from './ExperienceItem';
import { Section } from './Section';
import { ProjectCard } from './ProjectCard';
import { calculateTenure, calculateTotalExperience } from '@/lib/utils';
import { ResumeData, PersonalInfo, Experience, PreviousExperience, Project, Education } from "@/lib/data";

interface ResumeClientPageProps {
  resume: ResumeData;
  personalInfo: PersonalInfo;
}

export const ResumeClientPage = ({ resume, personalInfo }: ResumeClientPageProps) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const totalExperience = useMemo(
    () => calculateTotalExperience(resume.experience, resume.previousExperience),
    [resume.experience, resume.previousExperience]
  );

  const handleSkillSelect = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleClearSkills = (e: React.MouseEvent) => {
    setSelectedSkills([]);
    e.stopPropagation();
  };

  const filteredExperience = useMemo(() => {
    const hasSelectedSkills = selectedSkills.length > 0;
    if (!hasSelectedSkills) {
      return (resume.experience || []).map(exp => ({
        ...exp,
        isHighlighted: false,
        isDimmed: false,
        matchingSkills: [],
      }));
    }

    return (resume.experience || []).map(exp => {
      const matchingSkills = exp.skills?.filter(s => selectedSkills.includes(s)) ?? [];
      const isHighlighted = matchingSkills.length > 0;
      return {
        ...exp,
        isHighlighted,
        isDimmed: !isHighlighted,
        matchingSkills,
      };
    });
  }, [resume.experience, selectedSkills]);

  return (
    <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-lg">
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-primary/20 pb-8 mb-8">
        <div className="md:col-span-1 flex justify-center md:justify-start">
          <Avatar size={200} altText={personalInfo.name} />
        </div>
        <div className="md:col-span-2 text-center md:text-left">
          <h1 id="page-title" className="text-4xl font-bold text-primary">{personalInfo.name}</h1>
          {personalInfo.title && (
            <div className="flex items-baseline justify-center md:justify-start gap-x-3 flex-wrap mt-1">
              <h2 className="text-2xl text-primary/80 font-semibold">{personalInfo.title}</h2>
              {totalExperience && (
                <>
                  <p className="text-xl text-primary/70 font-medium">{totalExperience} of experience</p>
                </>
              )}
            </div>
          )}
          <div className="mt-4 text-lg">
            <p className="text-balance">{resume.summary.lead}</p>
            <AnimatePresence initial={false}>
              {isSummaryExpanded && (
                <motion.div
                  key="summary-highlights"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <ul className="mt-4 space-y-3 pt-4 border-t border-primary/10">
                    {resume.summary.highlights?.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-primary/70 flex-shrink-0 mt-0.5" />
                        <span className="text-balance">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsSummaryExpanded(prev => !prev)}
              className="flex items-center gap-1 text-sm font-semibold text-primary/80 hover:text-primary mt-4 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
              aria-expanded={isSummaryExpanded}
            >
              <span>{isSummaryExpanded ? 'Show less' : 'Show more'}</span>
              {isSummaryExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          </div>
          <div id="contact-links-section" className="mt-6">
            <ContactLinks contact={resume.contact} downloadUrl={resume.downloadUrl} />
          </div>
        </div>
      </section>

      {/* Grouped Skills Section */}
      <Section
        defaultOpen
        title={
          <div className="flex justify-between items-center flex-grow">
            <h2 className="text-3xl font-bold text-primary">Skills</h2>
            <AnimatePresence>
              {selectedSkills.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleClearSkills}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary/10"
                  aria-live="polite"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Clear ({selectedSkills.length})
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        }
      >
        <SkillsSection
          skills={resume.skills}
          selectedSkills={selectedSkills}
          onSkillSelect={handleSkillSelect}
        />
      </Section>

      {/* Experience Section (Timeline Style) */}
      <Section
        defaultOpen
        title={<h2 className="text-3xl font-bold text-primary">Professional Experience</h2>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredExperience.map((exp) => (
            <ExperienceItem
              key={`${exp.company}-${exp.role}`}
              experience={exp}
              isHighlighted={exp.isHighlighted}
              isDimmed={exp.isDimmed}
              matchingSkills={exp.matchingSkills}
            />
          ))}
        </div>
      </Section>

      {/* Projects Section */}
      {resume.projects && resume.projects.length > 0 && (
        <Section
          title={
            <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
              <BriefcaseIcon className="h-7 w-7" />
              <span>Projects</span>
            </h2>
          }>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resume.projects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </Section>
      )}

      {/* Education Section */}
      {resume.education && resume.education.length > 0 && (
        <Section
          title={
            <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
              <GraduationCapIcon className="h-7 w-7" />
              <span>Education</span>
            </h2>
          }>
          <div className="space-y-4">
            {resume.education.map((edu: Education) => (
              <div key={edu.institution} className="bg-card/50 p-4 rounded-lg border border-border/10">
                <h3 className="font-bold text-lg">{edu.institution}</h3>
                <p className="text-md text-foreground/80">{edu.degree}</p>
                <p className="text-sm text-foreground/60 mt-1">{edu.period}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Previous Experience Section */}
      {resume.previousExperience && resume.previousExperience.length > 0 && (
        <Section
          className="mb-0"
          title={<h2 className="text-3xl font-bold text-primary">Previous Experience</h2>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resume.previousExperience.map((exp: PreviousExperience) => {
              const tenure = calculateTenure(exp.period);
              return (
                <div key={`${exp.company}-${exp.role}`} className="bg-card/50 p-4 rounded-lg border border-border/10 transition-shadow hover:shadow-md">
                  <div>
                    <h3 className="font-bold text-base">{exp.role}</h3>
                    <p className="text-sm text-foreground/80">{exp.company} &middot; {exp.location}</p>
                    <div className="flex items-center gap-2 text-xs text-foreground/60 mt-1">
                      <span>{exp.period}</span>
                      {tenure && (
                        <>
                          <span className="text-foreground/40">&middot;</span>
                          <span>{tenure}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
};