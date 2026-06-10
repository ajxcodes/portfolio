import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Capture geolocation headers from Vercel in production
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');

    // Prioritize Vercel headers, fall back to body parameters passed during local dev
    const country = vercelCountry || body.Country || null;
    const city = vercelCity || body.City || null;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5808";

    const response = await fetch(`${apiBaseUrl}/api/analytics/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ReferrerSource: body.ReferrerSource,
        UserAgent: body.UserAgent,
        Country: country,
        City: city
      }),
    });

    if (!response.ok) {
      throw new Error(`C# API returned error status: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in views proxy handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
