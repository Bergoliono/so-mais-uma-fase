import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mockGames } from "@/lib/game-data";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const MAX_SCORE = 1000000;
const MAX_DURATION_SECONDS = 60 * 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = validatePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  if (!hasSupabaseConfig) {
    return NextResponse.json({
      ok: true,
      saved: false,
      reason: "Supabase não configurado; pontuação validada em modo demonstração."
    });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Entre para salvar sua pontuação no ranking." }, { status: 401 });
  }

  const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false
    }
  });

  const {
    data: { user },
    error: userError
  } = await authedSupabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Sessão inválida. Entre novamente." }, { status: 401 });
  }

  const adminSupabase = createAdminSupabaseClient();
  const db = adminSupabase ?? authedSupabase;

  const { data: game, error: gameError } = await db
    .from("games")
    .select("id, slug, type, ranked, status")
    .eq("slug", parsed.value.gameSlug)
    .eq("status", "published")
    .maybeSingle();

  if (gameError || !game) {
    return NextResponse.json({ ok: false, error: "Jogo não encontrado." }, { status: 404 });
  }

  if (game.type !== "official" || !game.ranked) {
    return NextResponse.json({ ok: false, error: "Este jogo não aceita ranking oficial." }, { status: 400 });
  }

  const { data: profile } = await db
    .from("profiles")
    .select("id, username, public_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) {
    return NextResponse.json(
      { ok: false, error: "Crie um username público no perfil antes de aparecer no ranking." },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from("scores")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: parsed.value.score,
      level: parsed.value.metadata.level,
      duration_seconds: parsed.value.duration_seconds,
      metadata: parsed.value.metadata
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Não foi possível salvar a pontuação." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: true, scoreId: data.id });
}

function validatePayload(body: unknown):
  | {
      ok: true;
      value: {
        gameSlug: string;
        score: number;
        duration_seconds: number;
        metadata: {
          correct: number;
          errors: number;
          bestCombo: number;
          level: number;
          durationSeconds: number;
        };
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Pedido inválido." };
  const input = body as Record<string, unknown>;
  const gameSlug = typeof input.gameSlug === "string" ? input.gameSlug : "";
  const score = typeof input.score === "number" ? Math.round(input.score) : Number.NaN;
  const metadata = input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : null;
  const durationSeconds =
    typeof input.duration_seconds === "number"
      ? Math.round(input.duration_seconds)
      : typeof metadata?.durationSeconds === "number"
        ? Math.round(metadata.durationSeconds)
        : Number.NaN;

  if (!gameSlug) return { ok: false, error: "Jogo inválido." };
  if (!Number.isFinite(score) || score < 0) return { ok: false, error: "Pontuação inválida." };
  if (score > MAX_SCORE) return { ok: false, error: "Pontuação acima do limite plausível." };
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_DURATION_SECONDS) {
    return { ok: false, error: "Duração inválida para o desafio." };
  }
  if (!metadata) return { ok: false, error: "Metadata obrigatória ausente." };

  const normalizedMetadata = {
    correct: numberField(metadata.correct),
    errors: numberField(metadata.errors),
    bestCombo: numberField(metadata.bestCombo),
    level: numberField(metadata.level),
    durationSeconds
  };

  if (Object.values(normalizedMetadata).some((value) => !Number.isFinite(value) || value < 0)) {
    return { ok: false, error: "Metadata inválida." };
  }

  const mockGame = mockGames.find((game) => game.slug === gameSlug);
  if (mockGame && (mockGame.type !== "official" || !mockGame.ranked)) {
    return { ok: false, error: "Este jogo não aceita ranking oficial." };
  }

  return {
    ok: true,
    value: {
      gameSlug,
      score,
      duration_seconds: durationSeconds,
      metadata: normalizedMetadata
    }
  };
}

function numberField(value: unknown) {
  return typeof value === "number" ? Math.round(value) : Number.NaN;
}
