'use client';

import { useEffect } from 'react';

export default function TenantStyle({
  tenant,
  themeUrl,
}: { tenant: string; themeUrl: string | null }) {
  useEffect(() => {
    // data-tenant am <html> setzen (für gescopte CSS)
    const html = document.documentElement;
    const prevTenant = html.getAttribute('data-tenant');
    html.setAttribute('data-tenant', tenant);

    // Theme-CSS zuverlässig in <head> einhängen
    let linkEl: HTMLLinkElement | null = null;
    if (themeUrl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = themeUrl;
      document.head.appendChild(linkEl);
    }

    return () => {
      if (prevTenant) html.setAttribute('data-tenant', prevTenant);
      else html.removeAttribute('data-tenant');
      if (linkEl && document.head.contains(linkEl)) {
        document.head.removeChild(linkEl);
      }
    };
  }, [tenant, themeUrl]);

  return null;
}

