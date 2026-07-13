import { NextRequest, NextResponse } from "next/server";
import {
  assertAdminFromBearer,
  getAdminGameById,
  patchExternalGame,
  upsertExternalGame,
  validateExternalGameInput
} from "@/lib/admin-games";
import type { GameRecord } from "@/lib/game-data";

type AdminGameRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: AdminGameRouteContext) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const game = await getAdminGameById(id);
  if (!game || game.type !== "external") return NextResponse.json({ ok: false, error: "Jogo externo não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true, mode: auth.mode, game });
}

export async function PUT(request: NextRequest, context: AdminGameRouteContext) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const current = await getAdminGameById(id);
  if (!current || current.type !== "external") return NextResponse.json({ ok: false, error: "Jogo externo não encontrado." }, { status: 404 });

  const parsed = validateExternalGameInput(await request.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  const result = await upsertExternalGame(parsed.value, current.id);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, mode: result.mode, game: result.game });
}

export async function PATCH(request: NextRequest, context: AdminGameRouteContext) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const patch: Partial<Pick<GameRecord, "status" | "featured" | "daily_challenge">> = {};

  if (body.status === "draft" || body.status === "published") patch.status = body.status;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (typeof body.daily_challenge === "boolean") patch.daily_challenge = body.daily_challenge;

  const result = await patchExternalGame(id, patch);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, mode: result.mode, game: result.game });
}
