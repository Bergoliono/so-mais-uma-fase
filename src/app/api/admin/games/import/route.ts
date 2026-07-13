import { NextRequest, NextResponse } from "next/server";
import { assertAdminFromBearer, upsertExternalGame, validateExternalGameInput, type ExternalGameInput } from "@/lib/admin-games";

const IMPORT_LIMIT = 50;

export async function POST(request: NextRequest) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.games) ? body.games : [];
  const statusOverride = body.status === "published" ? "published" : body.status === "draft" ? "draft" : null;

  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "Envie pelo menos um jogo para importar." }, { status: 400 });
  }

  if (items.length > IMPORT_LIMIT) {
    return NextResponse.json({ ok: false, error: `Importe no máximo ${IMPORT_LIMIT} jogos por vez.` }, { status: 400 });
  }

  const imported = [];
  const failed = [];

  for (const [index, item] of items.entries()) {
    const parsed = validateExternalGameInput({
      ...(item as Partial<ExternalGameInput>),
      status: statusOverride ?? (item as Partial<ExternalGameInput>).status
    });

    if (!parsed.ok) {
      failed.push({ index, title: String((item as { title?: unknown }).title ?? ""), error: parsed.error });
      continue;
    }

    const result = await upsertExternalGame(parsed.value);
    if (!result.ok) {
      failed.push({ index, title: parsed.value.title, error: result.error });
      continue;
    }

    imported.push(result.game);
  }

  return NextResponse.json({
    ok: failed.length === 0,
    mode: auth.mode,
    imported,
    failed,
    summary: {
      total: items.length,
      imported: imported.length,
      failed: failed.length
    }
  });
}
