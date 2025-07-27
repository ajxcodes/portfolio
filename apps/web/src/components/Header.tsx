"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Avatar } from "./Avatar";
import { ContactLinks, type ContactInfo } from "./ContactLinks";

interface HeaderProps {
  name: string;
  contact: ContactInfo;
}

export const Header = ({ name, contact }: HeaderProps) => {
  const pathname = usePathname();
  // Initialize state based on the path to prevent flashes of content.
  const [isPageTitleVisible, setIsPageTitleVisible] = useState(pathname === '/resume');
  const [isPageContactLinksVisible, setIsPageContactLinksVisible] = useState(pathname === '/resume');

  useEffect(() => {
    const pageTitleEl = document.getElementById("page-title");
    const contactLinksEl = document.getElementById("contact-links-section");

    let titleObserver: IntersectionObserver;
    if (pageTitleEl) {
      titleObserver = new IntersectionObserver(
        ([entry]) => setIsPageTitleVisible(entry.isIntersecting),
        { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
      );
      titleObserver.observe(pageTitleEl);
    } else {
      setIsPageTitleVisible(false);
    }

    let contactObserver: IntersectionObserver;
    if (contactLinksEl) {
      contactObserver = new IntersectionObserver(
        ([entry]) => setIsPageContactLinksVisible(entry.isIntersecting),
        { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
      );
      contactObserver.observe(contactLinksEl);
    } else {
      // If the contact section isn't on the page, it's not visible.
      setIsPageContactLinksVisible(false);
    }

    return () => {
      if (pageTitleEl && titleObserver) {
        titleObserver.unobserve(pageTitleEl);
      }
      if (contactLinksEl && contactObserver) {
        contactObserver.unobserve(contactLinksEl);
      }
    };
  }, [pathname]); // Re-run the effect every time the page path changes.

  // Show header contact links only when the page's contact links are not visible.
  const showHeaderContactLinks = !isPageContactLinksVisible;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm transition-colors duration-300">
      <nav className="container mx-auto flex justify-between items-center px-4 h-20">
        {/* Left side: Conditionally visible name and avatar */}
        <div className="flex-1">
          <Link
            href="/"
            className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${!isPageTitleVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}`}
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
          {/* Contact links for larger screens, dynamically shown based on scroll position. */}
          {showHeaderContactLinks && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="w-px h-6 bg-border" />
              <ContactLinks contact={contact} showText={false} />
            </div>
          )}
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
};
