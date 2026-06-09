"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5808";

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

      fetch(`${API_BASE_URL}/api/analytics/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ReferrerSource: referrerSource,
          UserAgent: navigator.userAgent,
        }),
      }).catch(err => console.error("Failed to log page view telemetry:", err));
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
            let linkId = "00000000-0000-0000-0000-000000000000";

            if (linkIdStr && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkIdStr)) {
              linkId = linkIdStr;
            } else {
              // Fallback GUIDs for default static links to prevent 400 Bad Request errors on click analytics
              if (anchor.href.includes("github.com")) {
                linkId = "e2b02e77-508b-4c08-8e6c-7e6df5b9ef18";
              } else if (anchor.href.includes("linkedin.com")) {
                linkId = "82a884e9-1144-42b7-8ce6-902279b9a67a";
              } else if (anchor.href.startsWith("mailto:")) {
                linkId = "c389bf44-6722-487a-92e1-456cb04ea78f";
              } else if (anchor.href.includes("resume") || anchor.hasAttribute("download")) {
                linkId = "f2c3bf99-8809-411a-abcf-4d9bc2133499";
              }
            }

            // Only post click analytics if we resolved a valid or fallback LinkId Guid
            if (linkId !== "00000000-0000-0000-0000-000000000000") {
              const referrerSource = sessionStorage.getItem("referrer_source") || "Direct";
              fetch(`${API_BASE_URL}/api/analytics/clicks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  LinkId: linkId,
                  ReferrerSource: referrerSource,
                  UserAgent: navigator.userAgent,
                }),
              }).catch(err => console.error("Failed to log link click telemetry:", err));
            }
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
