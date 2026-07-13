import { NextRequest, NextResponse } from "next/server";
import { assertAdminFromBearer, upsertExternalGame } from "@/lib/admin-games";
import { fetchGameDistributionGames } from "@/lib/gamedistribution";

const MAX_SYNC_LIMIT = 100;

export async function POST(request: NextRequest) {
  const auth = await assertAdminFromBearer(request.headers.get("authorization"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const sourceUrl = String(body.source_url || process.env.GAMEDISTRIBUTION_FEED_URL || "").trim();
  const dryRun = body.dry_run !== false;
  const status = body.status === "published" ? "published" : "draft";
  const limit = Math.max(1, Math.min(Number(body.limit || 25), MAX_SYNC_LIMIT));

  if (!sourceUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configure GAMEDISTRIBUTION_FEED_URL ou informe source_url para sincronizar jogos reais."
      },
      { status: 400 }
    );
  }

  let normalized;
  try {
    normalized = await fetchGameDistributionGames({ sourceUrl, status, limit });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Não foi possível ler o feed GameDistribution."
      },
      { status: 400 }
    );
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: auth.mode,
      dry_run: true,
      games: normalized.games,
      failed: normalized.failed,
      summary: {
        total: normalized.games.length + normalized.failed.length,
        ready: normalized.games.length,
        failed: normalized.failed.length
      }
    });
  }

  const imported = [];
  const failed = [...normalized.failed];

  for (const game of normalized.games) {
    const result = await upsertExternalGame(game);
    if (!result.ok) {
      failed.push({ index: imported.length, title: game.title, error: result.error ?? "Erro ao salvar jogo." });
      continue;
    }

    imported.push(result.game);
  }

  return NextResponse.json({
    ok: failed.length === 0,
    mode: auth.mode,
    dry_run: false,
    imported,
    failed,
    summary: {
      total: normalized.games.length + normalized.failed.length,
      imported: imported.length,
      failed: failed.length
    }
  });
}
