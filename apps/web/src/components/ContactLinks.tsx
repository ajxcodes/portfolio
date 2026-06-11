import React, { useState } from 'react';
import {
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
  CalendarIcon,
  DownloadIcon,
  InstagramIcon,
  LinkIcon,
} from '@/components/icons';
import { type ContactInfo } from '@/lib/data';
import { DownloadProgressModal } from '@/components/DownloadProgressModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

interface ContactLinksProps {
  contact: ContactInfo;
  showText?: boolean;
  downloadUrl?: string;
}

const iconMap: Record<string, React.ComponentType<{ className: string }>> = {
  email: MailIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  calendar: CalendarIcon,
  instagram: InstagramIcon,
};

const formatText = (type: string, url: string) => {
  switch (type.toLowerCase()) {
    case 'email': return url.replace('mailto:', '');
    case 'linkedin': return url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
    case 'github': return url.replace(/https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '');
    case 'instagram': return url.replace(/https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
    case 'calendar': return "Let's Chat";
    default: return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
};

const formatHref = (type: string, url: string) => {
  if (type.toLowerCase() === 'email') {
    return url.includes('@') && !url.startsWith('mailto:') ? `mailto:${url}` : url;
  }
  return url.startsWith('http') || url.startsWith('mailto:') ? url : `https://${url}`;
};

export const ContactLinks = ({ contact, showText = true, downloadUrl }: ContactLinksProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Defensive check
  if (!contact || !contact.links) {
    console.error("ContactLinks component was rendered without the required 'contact.links' array.");
    return null;
  }

  const regularLinks = contact.links.filter(l => l.type.toLowerCase() !== 'resume');

  interface ContactLinkItem {
    href: string;
    Icon: React.ElementType;
    text: string;
    label: string;
    linkId?: string;
    download?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }

  const items: ContactLinkItem[] = regularLinks.map(link => ({
    href: formatHref(link.type, link.url),
    Icon: iconMap[link.type.toLowerCase()] || LinkIcon,
    text: formatText(link.type, link.url),
    label: `${link.type.charAt(0).toUpperCase() + link.type.slice(1)} Link`,
    linkId: link.linkId,
  }));

  // Resume download
  if (downloadUrl) {
    const resumeLink = contact.links.find(l => l.type.toLowerCase() === 'resume');
    items.push({
      href: downloadUrl,
      Icon: DownloadIcon,
      text: "Resume",
      label: 'Download Resume',
      download: true,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); setIsModalOpen(true); },
      linkId: resumeLink?.linkId || 'resume',
    } as any);
  }

  return (
    <>
      <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap text-lg">
        {items.map(({ href, Icon, text, label, download, onClick, linkId }) => {
          const isExternal = href.startsWith('http');
          return (
            <a
              key={href}
              href={href}
              aria-label={label}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
              download={download}
              onClick={onClick}
              data-link-id={linkId}
            >
              <Icon className="h-5 w-5" />
              {showText && <span>{text}</span>}
            </a>
          );
        })}
      </div>

      <DownloadProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        apiBaseUrl={API_BASE_URL}
      />
    </>
  );
};
