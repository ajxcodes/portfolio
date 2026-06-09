import { useState, useEffect } from 'react';
import { Experience } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon } from './icons';
import { calculateTenure } from '@/lib/utils';

interface ExperienceItemProps {
  experience: Experience;
  isHighlighted: boolean;
  isDimmed: boolean;
  matchingSkills: string[];
}

export const ExperienceItem = ({ experience: exp, isHighlighted, isDimmed, matchingSkills }: ExperienceItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const tenure = calculateTenure(exp.period);

  useEffect(() => {
    if (matchingSkills.length > 0) {
      setIsExpanded(true);
      setIsSkillsExpanded(true);
    }
  }, [matchingSkills.length]);

  return (
    <motion.div
      layout
      animate={{
        scale: isHighlighted ? 1.03 : (isDimmed ? 0.98 : 1),
        opacity: isDimmed ? 0.6 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={clsx(
        "terminal-card p-6 rounded-xl flex flex-col h-full transition-all duration-300",
        isHighlighted
          ? "border-l-4 border-l-primary bg-primary/[0.04] border-t-primary/20 border-r-primary/20 border-b-primary/20 shadow-lg shadow-primary/5"
          : "border-l-primary/10"
      )}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-bold font-mono text-primary">
              {exp.role}
            </h3>
            <p className="font-semibold text-foreground/85 font-mono text-sm">{exp.company}</p>
            <div className="flex items-center gap-2 text-xs text-foreground/70 flex-wrap font-mono mt-1.5">
              <span className="bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{exp.period}</span>
              {tenure && (
                <>
                  <span className="text-foreground/40">&middot;</span>
                  <span className="bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{tenure}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 -m-1 text-foreground/60 hover:text-primary transition-colors rounded-full flex-shrink-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
          >
            {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto', marginTop: '1rem' },
                collapsed: { opacity: 0, height: 0, marginTop: 0 },
              }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <ul className="space-y-2.5 text-sm font-mono opacity-95">
                {exp.results.map((result, index) => (
                  <li key={index} className="text-balance flex items-start gap-2 leading-relaxed">
                    <span className="text-primary/50 select-none mt-1">-</span>
                    <span>{result}</span>
                  </li>
                ))}
              </ul>

              {/* Skills Section */}
              {exp.skills && exp.skills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/10">
                  <button
                    onClick={() => setIsSkillsExpanded((prev) => !prev)}
                    className="flex justify-between items-center w-full text-left text-sm font-semibold text-primary/80 hover:text-primary transition-colors"
                    aria-expanded={isSkillsExpanded}
                  >
                    <span>Skills Used</span>
                    {isSkillsExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isSkillsExpanded && (
                      <motion.div
                        key="skills-content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                          open: { opacity: 1, height: 'auto', marginTop: '0.75rem' },
                          collapsed: { opacity: 0, height: 0, marginTop: 0 },
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2">
                          {exp.skills.map((skill) => {
                            const isMatched = matchingSkills.includes(skill);
                            return (
                              <span 
                                key={skill} 
                                className={clsx(
                                  "skill-btn select-none pointer-events-none",
                                  isMatched && "selected"
                                )}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
