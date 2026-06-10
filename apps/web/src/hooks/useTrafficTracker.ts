"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Synchronous check to avoid async/microtask delay in tests and for cached values
function getLocalGeoDetailsSync() {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
  const geoUrl = process.env.NEXT_PUBLIC_GEOIP_SERVICE_URL;

  // If we are not local, in a test environment, or have no GeoIP service URL configured, skip geolocation
  if (!isLocal || isTest || !geoUrl) {
    return { Country: null, City: null };
  }

  try {
    const cached = sessionStorage.getItem("local_geo_details");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  
  return null; // Needs async fetch
}

// Asynchronous fetch from GeoIP service
async function fetchLocalGeoDetailsAsync() {
  const geoUrl = process.env.NEXT_PUBLIC_GEOIP_SERVICE_URL;
  if (!geoUrl) return { Country: null, City: null };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(geoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    const geo = {
      Country: data.country_name || data.country || null,
      City: data.city || null
    };
    
    sessionStorage.setItem("local_geo_details", JSON.stringify(geo));
    return geo;
  } catch (e) {
    return { Country: null, City: null };
  }
}

export function useTrafficTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 1. Extract referrer source from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const refParam = searchParams.get("ref");
    if (refParam) {
      sessionStorage.setItem("referrer_source", refParam);
    }

    const referrerSource = sessionStorage.getItem("referrer_source") || "Direct";

    // 2. Track page view on path changes, preventing duplicate strict-mode runs
    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;

      const track = async () => {
        let geo = getLocalGeoDetailsSync();
        if (!geo) {
          geo = await fetchLocalGeoDetailsAsync();
        }
        
        fetch("/api/analytics/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ReferrerSource: referrerSource,
            UserAgent: navigator.userAgent,
            Country: geo.Country,
            City: geo.City
          }),
        }).catch(err => console.error("Failed to log page view telemetry:", err));
      };

      track();
    }
  }, [pathname]);

  useEffect(() => {
    // 3. Track outbound link clicks globally
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href, window.location.href);
          const isExternal = url.host !== window.location.host;

          if (isExternal || anchor.hasAttribute("download")) {
            const linkIdStr = anchor.getAttribute("data-link-id");

            // Only track clicks that carry a valid database link ID
            if (!linkIdStr || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkIdStr)) {
              return;
            }

            const referrerSource = sessionStorage.getItem("referrer_source") || "Direct";

            const trackClick = async () => {
              let geo = getLocalGeoDetailsSync();
              if (!geo) {
                geo = await fetchLocalGeoDetailsAsync();
              }

              fetch("/api/analytics/clicks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  LinkId: linkIdStr,
                  ReferrerSource: referrerSource,
                  UserAgent: navigator.userAgent,
                  Country: geo.Country,
                  City: geo.City
                }),
              }).catch(err => console.error("Failed to log link click telemetry:", err));
            };

            trackClick();
          }
        } catch {
          // Ignore invalid URL parses
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);
}
