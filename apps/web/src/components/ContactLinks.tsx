import React from 'react';
import {
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
  CalendarIcon,
  DownloadIcon,
} from '@/components/icons';
import { type ContactInfo } from '@/lib/data';

interface ContactLinksProps {
  contact: ContactInfo;
  showText?: boolean;
  downloadUrl?: string;
}

export const ContactLinks = ({ contact, showText = true, downloadUrl }: ContactLinksProps) => {
  // A defensive check prevents the component from crashing if the contact prop is missing.
  if (!contact) {
    console.error("ContactLinks component was rendered without the required 'contact' prop.");
    return null;
  }

  const contactItems = [
    {
      href: `mailto:${contact.email}`,
      Icon: MailIcon,
      text: contact.email,
      label: `Email ${contact.email}`,
    },
    {
      href: `https://${contact.linkedin}`,
      Icon: LinkedInIcon,
      text: contact.linkedin.replace('linkedin.com/in/', ''),
      label: 'LinkedIn Profile',
    },
    {
      href: `https://${contact.github}`,
      Icon: GitHubIcon,
      text: contact.github.replace('github.com/', ''),
      label: 'GitHub Profile',
    },
    // The calendar link is now driven by data and will only appear if provided.
    ...(contact.calendar ? [{
      href: contact.calendar,
      Icon: CalendarIcon,
      text: "Let's Chat",
      label: 'Schedule a meeting',
    }] : []),
    ...(downloadUrl ? [{
      href: downloadUrl,
      Icon: DownloadIcon,
      text: "Resume",
      label: 'Download Resume',
      download: true,
    }] : []),
  ];

  return (
    <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap text-lg">
      {contactItems.map(({ href, Icon, text, label, download }) => {
        const isExternal = href.startsWith('http');
        return (
          <a
            key={href}
            href={href}
            aria-label={label}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            download={download}
          >
            <Icon className="h-5 w-5" />
            {showText && <span>{text}</span>}
          </a>
        );
      })}
    </div>
  );
};
