// app/admin/style/page.tsx
import { notFound } from "next/navigation";
import StyleStudio from "./StyleStudio";

export default function Page() {
  // Guard: nur sichtbar, wenn Flag aktiv
  if (process.env.NEXT_PUBLIC_ENABLE_STYLE_STUDIO !== "1") {
    notFound();
  }
  return <StyleStudio />;
}

