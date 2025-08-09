"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CodeIcon,
  DatabaseIcon,
  LightbulbIcon,
  ServerCogIcon,
  TerminalIcon,
} from "./icons";
import { SkillGroup } from "@/lib/data";

interface SkillsSectionProps {
  skills: SkillGroup[];
  selectedSkills: string[];
  onSkillSelect: (skill: string) => void;
}

const SKILLS_TO_SHOW_INITIALLY = 6;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const categoryIcons: { [key: string]: React.ElementType } = {
  "Languages & Frameworks": CodeIcon,
  "Architecture & DevOps": ServerCogIcon,
  "Databases & Data": DatabaseIcon,
  "Scripting & T-SQL": TerminalIcon,
  "Principles & Methodologies": LightbulbIcon,
};

export const SkillsSection = ({ skills, selectedSkills, onSkillSelect }: SkillsSectionProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {skills.map((skillGroup: SkillGroup) => {
        const Icon = categoryIcons[skillGroup.category];
        const isExpanded = expandedCategories.includes(skillGroup.category);
        const hasMore = skillGroup.items.length > SKILLS_TO_SHOW_INITIALLY;
        const skillsToShow = isExpanded ? skillGroup.items : skillGroup.items.slice(0, SKILLS_TO_SHOW_INITIALLY);

        return (
          <motion.div
            key={skillGroup.category}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02, boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-card/70 backdrop-blur-sm p-6 rounded-lg border border-border/20 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              {Icon && <Icon className="h-6 w-6 text-primary" />}
              <h3 className="text-lg font-bold text-primary">{skillGroup.category}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsToShow.map((skill: string) => (
                <button
                  key={skill}
                  onClick={() => onSkillSelect(skill)}
                  className={`skill-btn ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {hasMore && (
              <button onClick={() => toggleCategory(skillGroup.category)} className="flex items-center justify-center gap-1 text-sm text-primary/80 hover:text-primary mt-auto pt-2 border-t border-border/20">
                {isExpanded ? "Show Less" : `Show ${skillGroup.items.length - SKILLS_TO_SHOW_INITIALLY} More`}
                {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};