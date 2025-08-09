function parseDate(dateString: string): Date {
  if (dateString.toLowerCase().trim() === 'present') {
    return new Date();
  }
  return new Date(dateString);
}

function getMonthsFromPeriod(period: string): number | null {
  if (!period) return null;

  const parts = period.split(/–|-/);
  if (parts.length !== 2) return null;

  const [startStr, endStr] = parts;
  const startDate = parseDate(startStr.trim());
  const endDate = parseDate(endStr.trim());

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null;
  }

  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months -= startDate.getMonth();
  months += endDate.getMonth();

  // Add 1 because the period is inclusive. e.g. Jan 2022 - Jan 2022 is 1 month.
  const totalMonths = months + 1;

  if (totalMonths <= 0) return null;
  return totalMonths;
}

export function calculateTenure(period: string): string | null {
  const totalMonths = getMonthsFromPeriod(period);
  if (totalMonths === null) return null;
  
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  const yearStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : '';
  const monthStr = remainingMonths > 0 ? `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}` : '';

  return [yearStr, monthStr].filter(Boolean).join(' ');
}

import { type Experience, type PreviousExperience } from './data';

export function calculateTotalExperience(experience: Experience[], previousExperience: PreviousExperience[]): string | null {
  const allExperience = [...(experience || []), ...(previousExperience || [])];

  const totalMonths = allExperience.reduce((acc, exp) => {
    const months = getMonthsFromPeriod(exp.period);
    return acc + (months || 0);
  }, 0);

  if (totalMonths === 0) return null;

  const years = Math.floor(totalMonths / 12);

  if (years <= 0) return null;

  return `${years}+ years`;
}