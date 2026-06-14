"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { ResumeHeaderPhoto } from "@/components/ResumeHeaderPhoto";
import { XCircleIcon } from '@/components/icons';
import { ContactLinks } from '@/components/ContactLinks';
import { SkillsSection } from '@/components/SkillsSection';
import { ExperienceItem } from './ExperienceItem';
import { Section } from './Section';
import { ProjectCard } from './ProjectCard';
import { calculateTenure, calculateTotalExperience } from '@/lib/utils';
import { ResumeData, PersonalInfo, PreviousExperience, Education } from "@/lib/data";
import { BotIcon } from './icons';
import { useEffect } from 'react';

const TypewriterText = () => {
  const texts = [
    "Ask my AI Assistant...",
    "Ask about my experience...",
    "Chat with my AI...",
    "Explore my projects..."
  ];
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentText) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % texts.length);
    } else {
      timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, displayText.length + (isDeleting ? -1 : 1)));
      }, isDeleting ? 30 : 60);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex]);

  return (
    <span className="relative z-10 inline-block min-w-[200px] text-left font-mono text-sm">
      {displayText}
      <span className="animate-pulse font-bold ml-0.5">_</span>
    </span>
  );
};

interface ResumeClientPageProps {
  resume: ResumeData;
  personalInfo: PersonalInfo;
}

export const ResumeClientPage = ({ resume, personalInfo }: ResumeClientPageProps) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!resume.experience) return counts;
    resume.experience.forEach(exp => {
      if (exp.skills) {
        exp.skills.forEach(skill => {
          counts[skill] = (counts[skill] || 0) + 1;
        });
      }
    });
    return counts;
  }, [resume.experience]);

  return (
    <div className="max-w-6xl mx-auto terminal-card rounded-2xl shadow-xl overflow-hidden">
      {/* Title Bar */}
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
      </div>

      <div className="p-8">
        {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-primary/20 pb-8 mb-8">
        <div className="md:col-span-1 flex justify-center md:justify-start">
          <ResumeHeaderPhoto 
            size={200} 
            altText={personalInfo.name} 
            photoUrlLight={resume.photoUrlLight}
            photoUrlDark={resume.photoUrlDark}
          />
        </div>
        <div className="md:col-span-2 text-center md:text-left">
          <h1 id="page-title" className="text-4xl font-bold font-mono text-primary flex items-center justify-center md:justify-start gap-2">
            {personalInfo.name}
          </h1>
          {personalInfo.title && (
            <div className="flex items-baseline justify-center md:justify-start gap-x-3 flex-wrap mt-1">
              <h2 className="text-2xl text-primary/80 font-semibold font-mono">{personalInfo.title}</h2>
              {isMounted && totalExperience && (
                <>
                  <p className="text-xl text-primary/70 font-medium font-mono text-xs bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{totalExperience} of experience</p>
                </>
              )}
            </div>
          )}
          <div className="mt-4 text-lg">
            <p className="text-balance">{personalInfo.intro}</p>
          </div>
          <div id="contact-links-section" className="mt-6">
            <ContactLinks contact={resume.contact} downloadUrl={resume.downloadUrl} />
          </div>
          <div className="mt-8 flex justify-center md:justify-start">
            <div className="relative inline-flex group">
              {/* Glowing background effect tied to button size */}
              <div className="absolute inset-0 bg-primary blur-xl rounded-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" style={{ animationDuration: '3s' }} />
              
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAiWidget'))}
                className="relative inline-flex items-center gap-3 px-6 py-3.5 font-semibold text-primary-foreground bg-primary rounded-xl overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                
                <div className="relative z-10 bg-primary-foreground/10 p-1.5 rounded-lg">
                  <BotIcon className="w-5 h-5 animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
                
                <TypewriterText />
              </button>

              {/* Notification dot placed OUTSIDE the overflow-hidden button */}
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" style={{ animationDuration: '2s' }}></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-foreground shadow-[0_0_8px_hsl(var(--primary-foreground))]"></span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
        {/* Main Column: Professional Experience, Previous Experience, Projects, Education */}
        <div className="lg:col-span-2 space-y-8">
          {/* Experience Section (Vertical Timeline Style) */}
          <Section
            defaultOpen
            title={
              <h2 className="text-3xl font-bold font-mono text-primary">
                Professional Experience
              </h2>
            }
          >
            <div className="flex flex-col gap-6">
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

          {/* Previous Experience Section */}
          {resume.previousExperience && resume.previousExperience.length > 0 && (
            <Section
              title={
                <h2 className="text-3xl font-bold font-mono text-primary">
                  Previous Experience
                </h2>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume.previousExperience.map((exp: PreviousExperience) => {
                  const tenure = calculateTenure(exp.period);
                  return (
                    <div key={`${exp.company}-${exp.role}`} className="terminal-card p-4 rounded-xl">
                      <div>
                        <h3 className="font-bold text-base font-mono">{exp.role}</h3>
                        <p className="text-sm text-foreground/80 font-mono">{exp.company} &middot; {exp.location}</p>
                        <div className="flex items-center gap-2 text-xs text-foreground/60 mt-1 font-mono">
                          <span>{exp.period}</span>
                          {tenure && (
                            <>
                              <span className="text-foreground/40">&middot;</span>
                              <span suppressHydrationWarning>{tenure}</span>
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

          {/* Projects Section */}
          {resume.projects && resume.projects.length > 0 && (
            <Section
              title={
                <h2 className="text-3xl font-bold font-mono text-primary">
                  Projects
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
                <h2 className="text-3xl font-bold font-mono text-primary">
                  Education
                </h2>
              }>
              <div className="space-y-4">
                {resume.education.map((edu: Education) => (
                  <div key={edu.institution} className="terminal-card p-4 rounded-xl flex flex-col">
                    <h3 className="font-bold font-mono text-lg text-primary flex items-center gap-1.5">
                      <span className="text-primary/50 select-none">&gt;</span>
                      {edu.institution}
                    </h3>
                    <p className="text-sm text-foreground/80 font-mono mt-1">{edu.degree}</p>
                    <p className="text-xs text-foreground/60 mt-1 font-mono bg-primary/5 px-2 py-0.5 rounded border border-primary/10 self-start">{edu.period}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar Column: Skills */}
        <div className="lg:col-span-1 space-y-8">
          {/* Grouped Skills Section */}
          <Section
            defaultOpen
            title={
              <div className="flex justify-between items-center flex-grow">
                <h2 className="text-2xl font-bold font-mono text-primary">
                  Skills
                </h2>
                <AnimatePresence>
                  {selectedSkills.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleClearSkills}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary/80 hover:text-primary transition-colors px-2 py-0.5 rounded-full hover:bg-primary/10"
                      aria-live="polite"
                    >
                      <XCircleIcon className="h-3.5 w-3.5" />
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
              skillCounts={skillCounts}
              layoutMode="sidebar"
            />
          </Section>
        </div>
        </div>
      </div>
    </div>
  );
};