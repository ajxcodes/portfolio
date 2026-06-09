"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ResumeHeaderPhotoProps {
  size?: number;
  altText: string;
  photoUrlLight?: string;
  photoUrlDark?: string;
}

export const ResumeHeaderPhoto = ({ 
  size = 200, 
  altText,
  photoUrlLight,
  photoUrlDark
}: ResumeHeaderPhotoProps) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  // Default to showing the dark theme image before mounting to prevent hydration mismatch
  const isLight = mounted && resolvedTheme === 'light';

  const lightSrc = photoUrlLight || "/images/me_day.jpg";
  const darkSrc = photoUrlDark || "/images/me_night.png";

  return (
    <div className="relative rounded-full overflow-hidden shadow-xl" style={containerStyle}>
      {/* Light theme image */}
      <div
        data-testid="light-photo-container"
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity: isLight ? 1 : 0 }}
      >
        <Image
          src={lightSrc}
          alt={altText}
          width={size}
          height={size}
          className="rounded-full object-cover w-full h-full"
          priority
        />
      </div>

      {/* Dark theme image */}
      <div
        data-testid="dark-photo-container"
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity: !isLight ? 1 : 0 }}
      >
        <Image
          src={darkSrc}
          alt={altText}
          width={size}
          height={size}
          className="rounded-full object-cover w-full h-full"
          priority
        />
      </div>
    </div>
  );
};
