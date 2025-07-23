"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Avatar } from "./Avatar";

export const Header = ({ name }: { name: string }) => {
  const [isPageTitleVisible, setIsPageTitleVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const pageTitleEl = document.getElementById("page-title");

    if (!pageTitleEl) {
      // If no title element exists on the current page, always show the name in the header.
      setIsPageTitleVisible(false);
      return;
    }

    // When a title element is found, create and start the observer.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPageTitleVisible(entry.isIntersecting);
      },
      {
        rootMargin: "-80px 0px 0px 0px",
        threshold: 0,
      }
    );

    observer.observe(pageTitleEl);

    // The cleanup function is crucial. It runs when the component unmounts
    // or when the effect re-runs due to a dependency change (like `pathname`).
    return () => {
      observer.unobserve(pageTitleEl);
    };
  }, [pathname]); // Re-run the effect every time the page path changes.

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm transition-colors duration-300">
      <nav className="container mx-auto flex justify-between items-center px-4 h-20">
        {/* Left side: Conditionally visible name and avatar */}
        <div className="flex-1">
          <Link
            href="/"
            className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${
              !isPageTitleVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
            aria-hidden={isPageTitleVisible}
            tabIndex={isPageTitleVisible ? -1 : 0} // Prevent tabbing when hidden
          >
            <Avatar size={40} altText={name} />
            <span className="hidden sm:block text-xl font-bold">{name}</span>
          </Link>
        </div>

        {/* Right side: Navigation links */}
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/resume" className="hover:text-primary transition-colors">Resume</Link>
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
};
