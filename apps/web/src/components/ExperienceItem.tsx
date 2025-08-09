import { useState } from 'react';
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
  const tenure = calculateTenure(exp.period);

  return (
    <motion.div
      layout
      animate={{
        scale: isHighlighted ? 1.03 : (isDimmed ? 0.98 : 1),
        opacity: isDimmed ? 0.6 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={clsx(
        "p-6 rounded-lg border transition-all duration-300 flex flex-col h-full",
        isHighlighted
          ? "bg-primary/5 border-primary/30 shadow-lg"
          : "bg-card/50 border-border/10 hover:shadow-md hover:border-border/30"
      )}
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-bold">{exp.role}</h3>
            <p className="font-semibold text-primary/80">{exp.company}</p>
            <div className="flex items-center gap-2 text-sm text-foreground/70 flex-wrap">
              <span>{exp.period}</span>
              {tenure && (
                <>
                  <span className="text-foreground/40">&middot;</span>
                  <span>{tenure}</span>
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
              <ul className="list-disc list-inside space-y-2 text-sm">
                {exp.results.map((result, index) => (
                  <li key={index} className="text-balance">{result}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isHighlighted && matchingSkills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-primary/20">
          <h4 className="text-sm font-semibold mb-2 text-primary/90">Matching Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {matchingSkills.map((skill) => (
              <span key={skill} className="matched-skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
