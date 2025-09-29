import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type LeadBody = {
  name: string;
  email: string;
  instagram?: string | null;
  company?: string | null;
  message?: string | null;
  consent: boolean;
  website?: string | null; // Honeypot
};

type LeadRecord = {
  name: string;
  email: string;
  instagram: string | null;
  company: string | null;
  message: string | null;
  consent: true;
  utm_source: string | null;
  utm_campaign: string | null;
  referer: string | null;
  user_agent: string | null;
  ip: string | null;
};

const MAX_PER_MINUTE = 1;
const MAX_PER_DAY = 5;

function emailValid(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function getSupabaseAdmin(): SupabaseClient {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE =
    process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("SUPABASE_ENV_MISSING");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

function getIp(headers: Record<string, string>): string | null {
  const xff = headers["x-forwarded-for"] || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || null;
}

async function checkRateLimit(supabase: SupabaseClient, ip: string): Promise<null | { code: number; error: string }> {
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const { count: minuteCount, error: err1 } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gt("created_at", minuteAgo);
  if (err1) return { code: 500, error: "DB_ERROR_RATE_MINUTE" };
  if ((minuteCount ?? 0) >= MAX_PER_MINUTE) return { code: 429, error: "RATE_LIMIT_MINUTE" };

  const { count: dayCount, error: err2 } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gt("created_at", dayAgo);
  if (err2) return { code: 500, error: "DB_ERROR_RATE_DAY" };
  if ((dayCount ?? 0) >= MAX_PER_DAY) return { code: 429, error: "RATE_LIMIT_DAY" };

  return null;
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  }).catch(() => void 0);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    const hdrs = Object.fromEntries(req.headers.entries()) as Record<string, string>;
    const ip = getIp(hdrs) ?? "unknown";
    const user_agent = hdrs["user-agent"] || null;
    const referer = hdrs["referer"] || null;

    const raw = (await req.json()) as unknown;
    const b = (raw as Partial<LeadBody>) ?? {};
    const { name, email, instagram, company, message, consent, website } = b;

    if (website && String(website).trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    if (!name || !String(name).trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    if (!email || !emailValid(String(email))) return NextResponse.json({ error: "EMAIL_INVALID" }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "CONSENT_REQUIRED" }, { status: 400 });

    const rl = await checkRateLimit(supabase, ip);
    if (rl) return NextResponse.json({ error: rl.error }, { status: rl.code });

    const payload: LeadRecord = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      instagram: instagram ? String(instagram).trim() : null,
      company: company ? String(company).trim() : null,
      message: message ? String(message).trim() : null,
      consent: true,
      utm_source: "konfigurator",
      utm_campaign: "demo_cta_form",
      referer,
      user_agent,
      ip,
    };

    const { error } = await supabase.from("leads").insert(payload);
    if (error) return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });

    const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || "";
    const safeBooking = bookingUrl && /^https?:\/\//.test(bookingUrl) ? bookingUrl : null;

    await Promise.all([
      sendResendEmail(
        payload.email,
        "LUZID Demo – danke für deine Anfrage ✨",
        `<div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
          <p>Hi ${payload.name.split(" ")[0] || ""} 👋</p>
          <p>Danke für deine Demo-Anfrage bei <strong>LUZID</strong>. Wir melden uns kurz zur Terminierung.</p>
          ${safeBooking ? `<p>Oder direkt hier buchen: <a href="${safeBooking}">${safeBooking}</a></p>` : ""}
          <p>Bis gleich ✨</p>
        </div>`
      ),
      process.env.SALES_INBOX
        ? sendResendEmail(
            process.env.SALES_INBOX,
            "Neue LUZID Demo-Lead",
            `<div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
              <p><strong>Neue Lead-Anfrage</strong></p>
              <ul>
                <li>Name: ${payload.name}</li>
                <li>Email: ${payload.email}</li>
                <li>Instagram: ${payload.instagram ?? "-"}</li>
                <li>Brand: ${payload.company ?? "-"}</li>
                <li>Hinweis: ${payload.message ?? "-"}</li>
                <li>Referer: ${payload.referer ?? "-"}</li>
                <li>IP: ${payload.ip ?? "-"}</li>
                <li>UA: ${payload.user_agent ?? "-"}</li>
              </ul>
            </div>`
          )
        : Promise.resolve(),
    ]).catch(() => void 0);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "UNEXPECTED";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

