import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeadBody = {
  name: string;
  email: string;
  instagram?: string | null;
  company?: string | null;
  message?: string | null;
  consent: boolean;
  website?: string | null; // Honeypot
};

function emailValid(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as unknown;
    const body = (raw as Partial<LeadBody>) ?? {};
    const { name, email, instagram, company, message, consent, website } = body;

    // Bot-Honeypot
    if (website && String(website).trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }
    if (!email || !emailValid(String(email))) {
      return NextResponse.json({ error: "EMAIL_INVALID" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "CONSENT_REQUIRED" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE =
      process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: "SUPABASE_ENV_MISSING" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const hdrs = Object.fromEntries(req.headers.entries()) as Record<string, string>;
    const ip = (hdrs["x-forwarded-for"] || "").split(",")[0]?.trim() || null;
    const user_agent = hdrs["user-agent"] || null;
    const referer = hdrs["referer"] || null;

    const payload = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      instagram: instagram ? String(instagram).trim() : null,
      company: company ? String(company).trim() : null,
      message: message ? String(message).trim() : null,
      consent: true,
      utm_source: "konfigurator",
      utm_campaign: "demo_cta_form",
      ip,
      user_agent,
      referer,
    };

    const { error } = await supabase.from("leads").insert(payload);
    if (error) {
      console.error("Supabase insert error", error);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Lead API error", error);
    const msg = error instanceof Error ? error.message : "UNEXPECTED";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

