"use client";

import { useRef, useState, type ReactNode } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

interface SectionProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  defaultOpen?: boolean;
}

export const Section = ({ title, children, className, id, defaultOpen = false }: SectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <motion.section
      ref={ref}
      id={id}
      className={clsx("border-b border-primary/10 last:border-b-0", className)}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="py-8">
        <div
          onClick={() => setIsExpanded(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(prev => !prev);
            }
          }}
          role="button"
          tabIndex={0}
          className="w-full flex justify-between items-center gap-4 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          aria-expanded={isExpanded}
        >
          {title}
          {isExpanded ? <ChevronUpIcon className="h-6 w-6 text-primary/70 flex-shrink-0" /> : <ChevronDownIcon className="h-6 w-6 text-primary/70 flex-shrink-0" />}
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="content"
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
              <div className="pt-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
