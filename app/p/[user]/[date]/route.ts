// app/p/[user]/[date]/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request, ctx:{ params: Promise<{user:string; date:string}> }) {
  const { user, date } = await ctx.params;
  const from = new URL(req.url);
  const to   = new URL(`/share/birth/${user.toLowerCase()}/${date}`, from);
  to.search = from.search;          // Query-Parameter (z. B. utm) mitnehmen
  return NextResponse.redirect(to, 308); // 308 = permanent
}

