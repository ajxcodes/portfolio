"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import * as LucideIcons from "lucide-react";
import clsx from "clsx";
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
  layoutMode?: "grid" | "sidebar";
  skillCounts?: Record<string, number>;
}

const SKILLS_TO_SHOW_INITIALLY = 5;

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

export const SkillsSection = ({ skills, selectedSkills, onSkillSelect, layoutMode = "grid", skillCounts }: SkillsSectionProps) => {
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
      className={layoutMode === "sidebar" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {skills.map((skillGroup: SkillGroup) => {
        let Icon = categoryIcons[skillGroup.category];
        if (skillGroup.iconName && (LucideIcons as any)[skillGroup.iconName]) {
          Icon = (LucideIcons as any)[skillGroup.iconName] as React.ElementType;
        }
        
        const isExpanded = expandedCategories.includes(skillGroup.category);
        const hasMore = skillGroup.items.length > SKILLS_TO_SHOW_INITIALLY;
        const skillsToShow = isExpanded ? skillGroup.items : skillGroup.items.slice(0, SKILLS_TO_SHOW_INITIALLY);

        return (
          <motion.div
            key={skillGroup.category}
            variants={itemVariants}
            className="terminal-card p-6 rounded-xl flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              {Icon && <Icon className="h-6 w-6 text-primary" />}
              <h3 className="text-lg font-bold text-primary">{skillGroup.category}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsToShow.map((skill: string) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => onSkillSelect(skill)}
                    className={clsx(
                      "skill-btn relative overflow-visible",
                      isSelected && "selected"
                    )}
                  >
                    {skill}
                    {isSelected && skillCounts && skillCounts[skill] > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-[9.5px] font-sans font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg select-none z-10 border border-white/10"
                      >
                        {skillCounts[skill]}
                      </motion.span>
                    )}
                  </button>
                );
              })}
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