/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useRef } from "react";

type TenantResponse = {
  slug: string;
  theme?: {
    version: number;
    css_url: string;
    css_hash: string;
    meta?: Record<string, any>;
    published_at?: string;
  } | null;
};

export default function TenantThemeLoader({ slug }: { slug: string }) {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const api =
      process.env.NEXT_PUBLIC_TENANT_API_BASE ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "";

    const isDev = process.env.NODE_ENV !== "production";

    const applyInlineFallback = () => {
      if (!isDev) return;               // Fallback nur in Dev
      if (styleRef.current) return;

      // slug-spezifischer Fallback (Lena rosa, Paul blau), nur als Notlösung
      const fallback = slug === "paul" ? "#0ea5e9" : "#ff87b7";
      const radius   = slug === "paul" ? ".5rem"   : "1.25rem";

      const style = document.createElement("style");
      style.textContent = `
        .btn, button {
          background:${fallback} !important;
          border-radius:${radius} !important;
          color:#fff !important;
          padding:.625rem 1rem !important;
          border:none !important;
          cursor:pointer !important;
          font-family:Inter, ui-sans-serif, system-ui, sans-serif !important;
        }`;
      document.head.appendChild(style);
      styleRef.current = style;
      console.warn("[ThemeLoader] inline fallback applied for", slug);
    };

    const removeInlineFallback = () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };

    async function run() {
      try {
        // Scoping-Attribut für das automatische API-Scoping
        document.documentElement.setAttribute("data-tenant", slug);

        if (!api) {
          console.warn("[ThemeLoader] missing API base env");
          applyInlineFallback();
          return;
        }

        const res = await fetch(`${api}/tenants/${slug}`, { cache: "no-store" }).catch(() => null as any);
        if (!res || !res.ok) {
          console.warn("[ThemeLoader] theme fetch failed:", res?.status);
          applyInlineFallback();
          return;
        }

        const json = (await res.json()) as TenantResponse;
        const url  = json.theme?.css_url;
        const hash = json.theme?.css_hash ?? "";
        if (!url) {
          console.warn("[ThemeLoader] no css_url in response");
          applyInlineFallback();
          return;
        }

        // Immer über Proxy + Cache-Bust laden (vermeidet CORS/CT-Issues, Safari-Cache)
        const href = `/api/proxy?u=${encodeURIComponent(url)}&v=${hash}`;

        let link = linkRef.current;
        if (!link) {
          link = document.createElement("link");
          link.rel = "stylesheet";
          document.head.appendChild(link);
          linkRef.current = link;
        }
        link.href = href;

        link.onload = () => {
          console.log("[ThemeLoader] CSS loaded:", href);
          removeInlineFallback();
        };
        link.onerror = () => {
          console.warn("[ThemeLoader] CSS load failed via proxy:", href);
          applyInlineFallback();
        };
      } catch {
        applyInlineFallback();
      }
    }

    run();

    // Cleanup bei Slug-Wechsel/Unmount
    return () => {
      if (linkRef.current) {
        document.head.removeChild(linkRef.current);
        linkRef.current = null;
      }
      removeInlineFallback();
    };
  }, [slug]);

  return null;
}

