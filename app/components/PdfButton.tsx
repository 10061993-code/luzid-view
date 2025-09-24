"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  date: string;
  folder?: "weekly" | "birth" | "partner";
};

export default function PdfButton({ slug, date, folder = "weekly" }: Props) {
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = process.env.NEXT_PUBLIC_BUCKET || "horoscopesv2";

  // Kandidatenlisten aus ENV (Dateinamen & Ordner)
  const envNames   = (process.env.NEXT_PUBLIC_PDF_CANDIDATES || "").trim();
  const singleName = (process.env.NEXT_PUBLIC_PDF_FILENAME || "").trim();
  const nameCandidates = (envNames || singleName || "index.pdf,report.pdf,weekly.pdf,preview.pdf")
    .split(",").map(s => s.trim()).filter(Boolean);

  const envFolders = (process.env.NEXT_PUBLIC_ASSET_FOLDERS || "").trim();
  const folderCandidates = (envFolders || `${folder},birth,partner`)
    .split(",").map(s => s.trim() as Props["folder"]).filter(Boolean);

  // Slug-Varianten (Groß-/Kleinschreibung)
  const slugCandidates = Array.from(new Set([
    slug,
    slug.charAt(0).toUpperCase() + slug.slice(1),
  ]));

  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      for (const f of folderCandidates) {
        for (const s of slugCandidates) {
          for (const n of nameCandidates) {
            const raw = `${base}/storage/v1/object/public/${bucket}/${f}/${s}/${date}/${n}`;
            const proxied = `/api/proxy?u=${encodeURIComponent(raw)}`;
            const res = await fetch(proxied, { method: "HEAD", cache: "no-store" });
            if (stop) return;
            if (res.ok) {
              console.log("[PdfButton] found:", raw);
              setHref(proxied);
              return;
            } else {
              console.log("[PdfButton] miss:", raw, res.status);
            }
          }
        }
      }
      setHref(null);
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, date, base, bucket]);

  if (!href) {
    return <button className="btn opacity-50 cursor-not-allowed" disabled>PDF nicht gefunden</button>;
  }
  return (
    <a href={href} target="_blank" rel="noopener" className="btn inline-block text-white">
      Download PDF
    </a>
  );
}

