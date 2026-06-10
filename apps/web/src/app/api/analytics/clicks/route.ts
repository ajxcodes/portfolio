import { NextResponse } from 'next/server';

function sanitizeString(val: any, maxLength: number): string | null {
  if (typeof val !== 'string') return null;
  let sanitized = val.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  // Basic HTML strip to prevent XSS/injection
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  return sanitized || null;
}

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate LinkId format (must be a valid UUID/GUID)
    if (!body.LinkId || typeof body.LinkId !== 'string' || !guidRegex.test(body.LinkId)) {
      return NextResponse.json({ error: 'Invalid or missing LinkId format' }, { status: 400 });
    }

    // Capture geolocation headers from Vercel in production
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');

    // Prioritize Vercel headers, fall back to body parameters passed during local dev
    const rawCountry = vercelCountry || body.Country || null;
    const rawCity = vercelCity || body.City || null;

    // Sanitize inputs
    const referrerSource = sanitizeString(body.ReferrerSource, 255) || "Direct";
    const userAgent = sanitizeString(body.UserAgent, 512) || "unknown";
    const country = sanitizeString(rawCountry, 100);
    const city = sanitizeString(rawCity, 100);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5808";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(`${apiBaseUrl}/api/analytics/clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LinkId: body.LinkId,
          ReferrerSource: referrerSource,
          UserAgent: userAgent,
          Country: country,
          City: city
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`C# API returned error status: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in clicks proxy handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
