import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Recebe a purga on-demand do backend (ver store-revalidation.service.ts no ERP)
// quando o painel altera catálogo/branding. Protegido por segredo compartilhado.
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET não configurado." },
      { status: 500 },
    );
  }

  let body: { secret?: string; tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];
  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({ ok: true, revalidated: tags });
}
