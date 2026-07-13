"use client";

import { useMemo, useState } from "react";
import { ArrowClockwise, CheckCircle, FloppyDisk, Heart, Lightning, XCircle } from "@phosphor-icons/react";
import type { SubmitScoreResult } from "@/lib/game-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Round = {
  sequence: number[];
  answer: number;
  options: number[];
  rule: string;
  startedAt: number;
};

type GameStats = {
  score: number;
  level: number;
  correct: number;
  errors: number;
  combo: number;
  bestCombo: number;
  lives: number;
  startedAt: number;
  finishedAt: number | null;
};

const initialStats: GameStats = {
  score: 0,
  level: 1,
  correct: 0,
  errors: 0,
  combo: 0,
  bestCombo: 0,
  lives: 3,
  startedAt: Date.now(),
  finishedAt: null
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createRound(level: number): Round {
  const difficulty = Math.min(6, Math.floor((level - 1) / 3) + 1);
  const start = Math.floor(Math.random() * 8) + 2 + difficulty;
  const step = Math.floor(Math.random() * (3 + difficulty)) + 1;
  const mode = level < 4 ? "linear" : Math.random() > 0.55 ? "multiply" : "linear";

  if (mode === "multiply") {
    const factor = Math.min(4, 2 + Math.floor(difficulty / 2));
    const sequence = [start, start * factor, start * factor * factor, start * factor * factor * factor];
    const answer = start * factor * factor * factor * factor;
    return {
      sequence,
      answer,
      options: shuffle([answer, answer + factor, Math.max(1, answer - factor), answer + step + factor]),
      rule: `multiplique por ${factor}`,
      startedAt: Date.now()
    };
  }

  const sequence = [start, start + step, start + step * 2, start + step * 3];
  const answer = start + step * 4;
  return {
    sequence,
    answer,
    options: shuffle([answer, answer + step, Math.max(0, answer - step), answer + step + difficulty]),
    rule: `some ${step}`,
    startedAt: Date.now()
  };
}

function scoreForAnswer(level: number, combo: number, elapsedMs: number) {
  const multiplier = 1 + Math.floor(level / 5) * 0.08;
  const fastBonus = elapsedMs <= 5000 ? 5 : 0;
  const comboBonus = (combo + 1) % 5 === 0 ? 20 : 0;
  return Math.round((10 + fastBonus + comboBonus) * multiplier);
}

export function SequenceLogicGame({ gameId }: { gameId: string }) {
  const [stats, setStats] = useState<GameStats>(() => ({ ...initialStats, startedAt: Date.now() }));
  const [round, setRound] = useState<Round>(() => createRound(1));
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [saveResult, setSaveResult] = useState<SubmitScoreResult | null>(null);
  const finished = stats.lives <= 0 || stats.finishedAt !== null;
  const durationSeconds = Math.max(1, Math.round(((stats.finishedAt ?? Date.now()) - stats.startedAt) / 1000));

  const statusLabel = useMemo(() => {
    if (finished) return "Fim de jogo";
    if (lastResult === "correct") return "Acertou";
    if (lastResult === "wrong") return "Errou";
    return "Escolha a próxima resposta";
  }, [finished, lastResult]);

  function choose(option: number) {
    if (finished) return;
    const elapsedMs = Date.now() - round.startedAt;
    const correct = option === round.answer;

    setStats((current) => {
      if (correct) {
        const nextCombo = current.combo + 1;
        const gained = scoreForAnswer(current.level, current.combo, elapsedMs);
        const nextLevel = current.level + 1;
        setRound(createRound(nextLevel));
        setLastResult("correct");
        return {
          ...current,
          score: current.score + gained,
          level: nextLevel,
          correct: current.correct + 1,
          combo: nextCombo,
          bestCombo: Math.max(current.bestCombo, nextCombo)
        };
      }

      const nextLives = current.lives - 1;
      setLastResult("wrong");
      if (nextLives <= 0) {
        return {
          ...current,
          lives: 0,
          errors: current.errors + 1,
          combo: 0,
          finishedAt: Date.now()
        };
      }
      setRound(createRound(current.level));
      return {
        ...current,
        lives: nextLives,
        errors: current.errors + 1,
        combo: 0
      };
    });
  }

  function restart() {
    const nextStats = { ...initialStats, startedAt: Date.now() };
    setStats(nextStats);
    setRound(createRound(1));
    setLastResult(null);
    setSaveResult(null);
  }

  async function saveScore() {
    const metadata = {
      correct: stats.correct,
      errors: stats.errors,
      bestCombo: stats.bestCombo,
      level: stats.level,
      durationSeconds
    };
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session }
    } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

    const response = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify({
        gameSlug: gameId,
        score: Math.max(0, stats.score),
        duration_seconds: durationSeconds,
        metadata
      })
    });
    const result = (await response.json()) as SubmitScoreResult;
    setSaveResult(result);
  }

  return (
    <section className="rounded-lg border border-teal-500/25 bg-white p-4 shadow-ranked">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">Sequência Lógica</p>
          <h2 className="text-2xl font-black tracking-tight text-ink">{statusLabel}</h2>
        </div>
        <div className="flex gap-1 text-red-500">
          {Array.from({ length: 3 }).map((_, index) => (
            <Heart key={index} size={20} weight={index < stats.lives ? "fill" : "regular"} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-teal-500/5 p-3">
        <Stat label="Pontuação" value={stats.score.toString()} />
        <Stat label="Fase" value={stats.level.toString()} />
        <Stat label="Combo" value={stats.combo.toString()} />
      </div>

      {!finished ? (
        <>
          <div className="mt-5 rounded-lg border border-line bg-paper p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Próximo número</p>
            <div className="grid grid-cols-4 gap-2">
              {round.sequence.map((number, index) => (
                <div
                  key={`${number}-${index}`}
                  className="flex h-14 items-center justify-center rounded-lg border border-teal-500/25 bg-white text-xl font-black text-ink"
                >
                  {number}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-muted">Dica de lógica: {round.rule}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {round.options.map((option) => (
              <button
                key={option}
                onClick={() => choose(option)}
                className="h-14 rounded-lg bg-action text-xl font-black text-white shadow-soft transition active:scale-[.98]"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm font-bold text-blue-700">
            <Lightning size={19} weight="fill" />
            Responda em até 5 segundos para ganhar bônus de velocidade.
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-line bg-paper p-4">
            <h3 className="text-xl font-black text-ink">Resultado final</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Pontuação final" value={stats.score.toString()} />
              <Stat label="Fase alcançada" value={stats.level.toString()} />
              <Stat label="Acertos" value={stats.correct.toString()} />
              <Stat label="Erros" value={stats.errors.toString()} />
              <Stat label="Melhor combo" value={stats.bestCombo.toString()} />
              <Stat label="Tempo" value={`${durationSeconds}s`} />
            </div>
          </div>

          <div className="grid gap-3">
            <button
              onClick={restart}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-black text-ink"
            >
              <ArrowClockwise size={18} weight="bold" />
              Jogar novamente
            </button>
            <button
              onClick={saveScore}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-action text-sm font-black text-white shadow-soft"
            >
              <FloppyDisk size={18} weight="bold" />
              Salvar pontuação
            </button>
          </div>

          {saveResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-bold ${
                saveResult.ok && saveResult.saved
                  ? "border-teal-500/25 bg-teal-500/10 text-teal-700"
                  : "border-amber-400/35 bg-amber-300/15 text-amber-800"
              }`}
            >
              {saveResult.ok && saveResult.saved ? <CheckCircle size={19} weight="fill" /> : <XCircle size={19} weight="fill" />}
              <span>
                {saveResult.ok
                  ? saveResult.saved
                    ? "Pontuação salva no ranking."
                    : saveResult.reason
                  : saveResult.error}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}
