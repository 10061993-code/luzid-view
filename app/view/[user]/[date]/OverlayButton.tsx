"use client";
import React from "react";

export default function OverlayButton({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-end justify-center p-6"
      style={{ zIndex: 50 }}
    >
      <a
        href={pdfUrl}
        target="_self"                // gleiches Tab, kein Popup
        rel="noreferrer"
        className="pointer-events-auto px-4 py-2 rounded-xl shadow
                   bg-black/70 text-white backdrop-blur hover:bg-black"
      >
        View PDF
      </a>
    </div>
  );
}

