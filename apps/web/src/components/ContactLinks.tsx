import React, { useState } from 'react';
import {
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
  CalendarIcon,
  DownloadIcon,
} from '@/components/icons';
import { type ContactInfo } from '@/lib/data';
import { DownloadProgressModal } from '@/components/DownloadProgressModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5808";

interface ContactLinksProps {
  contact: ContactInfo;
  showText?: boolean;
  downloadUrl?: string;
}

export const ContactLinks = ({ contact, showText = true, downloadUrl }: ContactLinksProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // A defensive check prevents the component from crashing if the contact prop is missing.
  if (!contact) {
    console.error("ContactLinks component was rendered without the required 'contact' prop.");
    return null;
  }

  const contactItems = [
    ...(contact.email ? [{
      href: contact.email.includes('@') && !contact.email.startsWith('mailto:') ? `mailto:${contact.email}` : contact.email,
      Icon: MailIcon,
      text: contact.email.replace('mailto:', ''),
      label: `Email ${contact.email}`,
      linkId: contact.linkIds?.["email"] || contact.linkIds?.["Email"]
    }] : []),
    ...(contact.linkedin ? [{
      href: contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`,
      Icon: LinkedInIcon,
      text: contact.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, ''),
      label: 'LinkedIn Profile',
      linkId: contact.linkIds?.["linkedin"] || contact.linkIds?.["LinkedIn"]
    }] : []),
    ...(contact.github ? [{
      href: contact.github.startsWith('http') ? contact.github : `https://${contact.github}`,
      Icon: GitHubIcon,
      text: contact.github.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, ''),
      label: 'GitHub Profile',
      linkId: contact.linkIds?.["github"] || contact.linkIds?.["GitHub"]
    }] : []),
    // The calendar link is now driven by data and will only appear if provided.
    ...(contact.calendar ? [{
      href: contact.calendar,
      Icon: CalendarIcon,
      text: "Let's Chat",
      label: 'Schedule a meeting',
      linkId: contact.linkIds?.["calendar"] || contact.linkIds?.["Calendar"]
    }] : []),
    ...(downloadUrl ? [{
      href: downloadUrl,
      Icon: DownloadIcon,
      text: "Resume",
      label: 'Download Resume',
      download: true,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setIsModalOpen(true);
      },
      linkId: contact.linkIds?.["resume"] || contact.linkIds?.["Resume"]
    }] : []),
  ];

  return (
    <>
      <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap text-lg">
        {contactItems.map(({ href, Icon, text, label, download, onClick, linkId }) => {
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
