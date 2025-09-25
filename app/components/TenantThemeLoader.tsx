'use client';

import { useEffect, useState } from "react";

type Tenant = {
  slug: string;
  css_url?: string | null;
  version?: string | null;
  meta?: Record<string, unknown> | null;
};

type Props = {
  slug: string;
  api?: string; // Basis-URL deiner API, z. B. "/api"
  children: React.ReactNode;
};

export default function TenantThemeLoader({ slug, api = "", children }: Props) {
  const [cssUrl, setCssUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTenant() {
      setError(null);
      try {
        const res = await fetch(`${api}/tenants/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        const t = data as Partial<Tenant>;
        const url = typeof t.css_url === "string" ? t.css_url : null;
        if (!cancelled) setCssUrl(url);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
        if (!cancelled) setError(msg);
      }
    }

    void fetchTenant();
    return () => {
      cancelled = true;
    };
  }, [slug, api]);

  return (
    <div data-tenant={slug}>
      {cssUrl && <link rel="stylesheet" href={cssUrl} />}
      {children}
      {error && (
        <p className="text-xs text-red-600">
          Theme konnte nicht geladen werden: {error}
        </p>
      )}
    </div>
  );
}

