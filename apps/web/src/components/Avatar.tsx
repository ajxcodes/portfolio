"use client"

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export const Avatar = ({ 
  size = 128, 
  altText,
  photoUrlLight,
  photoUrlDark
}: { 
  size?: number; 
  altText: string; 
  photoUrlLight?: string; 
  photoUrlDark?: string; 
}) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or nothing on the server to avoid hydration mismatch
    return <div className="rounded-full bg-card" style={{ width: `${size}px`, height: `${size}px` }} />;
  }

  const avatarSrc = resolvedTheme === 'light' 
    ? (photoUrlLight || '/images/me_day.jpg') 
    : (photoUrlDark || '/images/me_night.png');

  return (
    <Image src={avatarSrc} alt={altText} width={size} height={size} className="rounded-full object-cover" priority={size > 100} style={{ width: `${size}px`, height: `${size}px` }} />
  );
};
