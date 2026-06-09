export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const YEARS: string[] = [];
const currentYear = new Date().getFullYear();
for (let y = currentYear + 4; y >= 1970; y--) {
  YEARS.push(String(y));
}

export interface ParsedPeriod {
  startMonth: string;
  startYear: string;
  isCurrent: boolean;
  endMonth: string;
  endYear: string;
}

export function parsePeriod(period: string): ParsedPeriod {
  const result: ParsedPeriod = {
    startMonth: "",
    startYear: "",
    isCurrent: false,
    endMonth: "",
    endYear: ""
  };

  if (!period) return result;

  const parts = period.split(/\s*[-–—]\s*/);
  if (parts.length === 0) return result;

  const startPart = parts[0].trim();
  const endPart = parts[1] ? parts[1].trim() : "";

  const startTokens = startPart.split(/\s+/);
  if (startTokens.length === 1) {
    if (/^\d{4}$/.test(startTokens[0])) {
      result.startYear = startTokens[0];
    } else {
      result.startMonth = startTokens[0];
    }
  } else if (startTokens.length >= 2) {
    result.startMonth = startTokens[0];
    result.startYear = startTokens[1];
  }

  if (!endPart || endPart.toLowerCase() === "present" || endPart.toLowerCase() === "current") {
    result.isCurrent = true;
  } else {
    const endTokens = endPart.split(/\s+/);
    if (endTokens.length === 1) {
      if (/^\d{4}$/.test(endTokens[0])) {
        result.endYear = endTokens[0];
      } else {
        result.endMonth = endTokens[0];
      }
    } else if (endTokens.length >= 2) {
      result.endMonth = endTokens[0];
      result.endYear = endTokens[1];
    }
  }

  const normalizeMonth = (m: string) => {
    if (!m) return "";
    const idx = FULL_MONTHS.findIndex(fm => fm.toLowerCase().startsWith(m.toLowerCase()));
    if (idx !== -1) return MONTHS[idx];
    const shortIdx = MONTHS.findIndex(sm => sm.toLowerCase().startsWith(m.toLowerCase()));
    if (shortIdx !== -1) return MONTHS[shortIdx];
    return m;
  };

  result.startMonth = normalizeMonth(result.startMonth);
  result.endMonth = normalizeMonth(result.endMonth);

  return result;
}

export function formatPeriod(
  startMonth: string,
  startYear: string,
  isCurrent: boolean,
  endMonth: string,
  endYear: string
): string {
  const startStr = [startMonth, startYear].filter(Boolean).join(" ");
  const endStr = isCurrent ? "Present" : [endMonth, endYear].filter(Boolean).join(" ");
  return [startStr, endStr].filter(Boolean).join(" - ");
}

export function calculateDuration(
  startMonth: string,
  startYear: string,
  isCurrent: boolean,
  endMonth: string,
  endYear: string
): string {
  if (!startYear) return "";

  const startMonthIndex = MONTHS.indexOf(startMonth);
  const startM = startMonthIndex !== -1 ? startMonthIndex : 0;
  const startY = parseInt(startYear);

  let endM: number;
  let endY: number;

  if (isCurrent) {
    const now = new Date();
    endM = now.getMonth();
    endY = now.getFullYear();
  } else {
    if (!endYear) return "";
    const endMonthIndex = MONTHS.indexOf(endMonth);
    endM = endMonthIndex !== -1 ? endMonthIndex : 11;
    endY = parseInt(endYear);
  }

  const totalMonths = (endY - startY) * 12 + (endM - startM) + 1;

  if (isNaN(totalMonths) || totalMonths < 0) return "";

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  }

  if (parts.length === 0) {
    return "< 1 mo";
  }

  return parts.join(" ");
}
