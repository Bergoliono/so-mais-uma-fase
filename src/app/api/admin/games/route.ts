import { NextRequest, NextResponse } from "next/server";
import { assertAdminFromBearer, getAdminGames, upsertExternalGame, validateExternalGameInput } from "@/lib/admin-games";

export async function GET(request: NextRequest) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const games = await getAdminGames();
  return NextResponse.json({
    ok: true,
    mode: auth.mode,
    games: games.filter((game) => game.type === "external")
  });
}

export async function POST(request: NextRequest) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = validateExternalGameInput(await request.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  const result = await upsertExternalGame(parsed.value);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    game: result.game
  });
}
