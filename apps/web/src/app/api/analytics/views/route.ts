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

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 });
  }

  try {
    
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
      response = await fetch(`${apiBaseUrl}/api/analytics/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
    console.error("Error in views proxy handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
