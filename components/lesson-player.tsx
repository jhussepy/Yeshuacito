"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lesson } from "@/lib/types";

const praise = [
  "¡Estrategia brillante!",
  "Bien razonado.",
  "Tu esfuerzo dio resultado.",
  "¡Conexión descubierta!",
];

type Phase = "intro" | "play" | "saving" | "result";
type AnswerRecord = {
  exerciseId: string;
  answer: string;
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
};
type SavedResult = { xp: number; mastery: number; stars: number; accuracy: number };

function isSavedResult(value: unknown): value is SavedResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return ["xp", "mastery", "stars", "accuracy"].every((key) => typeof result[key] === "number");
}

export function LessonPlayer({ lesson, course }: { lesson: Lesson; course: string }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [currentHints, setCurrentHints] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lessonStartedAt, setLessonStartedAt] = useState(Date.now());
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  const [saveError, setSaveError] = useState("");

  const exercise = lesson.exercises[index];
  const isCorrect = selected.trim().toLowerCase() === exercise?.answer.toLowerCase();

  function beginLesson() {
    const now = Date.now();
    setLessonStartedAt(now);
    setQuestionStartedAt(now);
    setPhase("play");
  }

  function checkAnswer() {
    if (!selected || checked) return;
    const response: AnswerRecord = {
      exerciseId: exercise.id,
      answer: selected,
      correct: isCorrect,
      responseMs: Math.max(1, Date.now() - questionStartedAt),
      hintsUsed: currentHints,
    };
    setAnswers((current) => [...current, response]);
    setAnswered((value) => value + 1);
    if (isCorrect) setCorrect((value) => value + 1);
    setChecked(true);
  }

  async function persistCompletion() {
    const finalAnswers = answers;
    const finalCorrect = correct;
    const totalHints = finalAnswers.reduce((sum, answer) => sum + answer.hintsUsed, 0);
    setPhase("saving");
    setSaveError("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          correct: finalCorrect,
          total: answered,
          difficulty: Math.max(...lesson.exercises.map((item) => item.difficulty)),
          responseMs: Math.max(1, Date.now() - lessonStartedAt),
          hints: totalHints,
          answers: finalAnswers,
        }),
      });
      const responseBody = await response.text();
      let payload: unknown = null;
      if (responseBody) {
        try {
          payload = JSON.parse(responseBody);
        } catch {
          throw new Error(`El servidor devolvió una respuesta inválida (${response.status})`);
        }
      }
      const apiError = payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null;
      if (!response.ok) {
        throw new Error(apiError ?? `El servidor no pudo guardar el intento (${response.status})`);
      }
      if (!isSavedResult(payload)) throw new Error("El servidor no confirmó el progreso guardado");
      setSavedResult(payload);
      setPhase("result");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No pudimos guardar el intento");
      setPhase("play");
    }
  }

  function continueLesson() {
    if (!isCorrect) {
      setChecked(false);
      setSelected("");
      setCurrentHints((value) => Math.min(3, value + 1));
      setQuestionStartedAt(Date.now());
      return;
    }
    if (index === lesson.exercises.length - 1) {
      void persistCompletion();
      return;
    }
    setIndex((value) => value + 1);
    setSelected("");
    setChecked(false);
    setCurrentHints(0);
    setQuestionStartedAt(Date.now());
  }

  if (phase === "intro") {
    return (
      <section className="question card">
        <span className="eyebrow">Nueva misión · {lesson.xp} XP</span>
        <h1>{lesson.title}</h1>
        <p className="muted">{lesson.summary}</p>
        <div className="notice">
          <strong>Idea clave</strong>
          <p style={{ margin: "7px 0 0" }}>{lesson.concept}</p>
        </div>
        <h3 style={{ marginTop: 25 }}>Míralo en acción</h3>
        <p>{lesson.example}</p>
        <button className="btn" onClick={beginLesson}>Empezar práctica</button>
      </section>
    );
  }

  if (phase === "saving") {
    return (
      <section className="question card" aria-live="polite" style={{ textAlign: "center" }}>
        <div className="icon-box" style={{ margin: "0 auto 18px" }}>↻</div>
        <h1>Guardando tu progreso…</h1>
        <p className="muted">No cierres esta pantalla todavía.</p>
      </section>
    );
  }

  if (phase === "result" && savedResult) {
    return (
      <section className="question card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 60 }}>✦</div>
        <span className="eyebrow">Lección guardada</span>
        <h1>Tu estrategia creció</h1>
        <div className="stars" style={{ fontSize: 30 }}>
          {"★".repeat(savedResult.stars)}{"☆".repeat(3 - savedResult.stars)}
        </div>
        <div className="stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div><div className="metric">{Math.round(savedResult.accuracy * 100)}%</div><span className="muted">Precisión</span></div>
          <div><div className="metric">+{savedResult.xp}</div><span className="muted">XP</span></div>
          <div><div className="metric">{savedResult.mastery}</div><span className="muted">Dominio</span></div>
        </div>
        <p className="notice">Los intentos iniciales también cuentan: la precisión refleja todo tu proceso, no solo la respuesta final.</p>
        <Link className="btn" href={`/courses/${course}`}>Continuar al mapa</Link>
      </section>
    );
  }

  return (
    <section className="question card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="eyebrow">Modo foco</span>
        <span>{index + 1} / {lesson.exercises.length}</span>
      </div>
      <div className="progress"><span style={{ width: `${((index + 1) / lesson.exercises.length) * 100}%`, background: "var(--brand)" }} /></div>
      <h2 style={{ marginTop: 28 }}>{exercise.prompt}</h2>
      <div className="options">
        {exercise.options?.map((option) => (
          <button className={`option ${selected === option ? "selected" : ""}`} key={option} onClick={() => !checked && setSelected(option)}>{option}</button>
        ))}
        {!exercise.options && <input className="option" value={selected} inputMode="decimal" aria-label="Tu respuesta" onChange={(event) => setSelected(event.target.value)} />}
      </div>
      {checked && (
        <div className={`feedback ${isCorrect ? "good" : "try"}`}>
          <strong>{isCorrect ? praise[index % praise.length] : "Casi. Mira esta parte."}</strong>
          <p style={{ margin: "5px 0 0" }}>{isCorrect ? exercise.explanation : exercise.hints[Math.min(currentHints, 2)]}</p>
        </div>
      )}
      {saveError && <div className="feedback try" role="alert"><strong>No se guardó todavía.</strong> {saveError}. Inténtalo de nuevo sin perder tus respuestas.</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {!checked ? (
          <>
            <button className="btn" disabled={!selected} onClick={checkAnswer}>Comprobar</button>
            <button className="btn secondary" onClick={() => setCurrentHints((value) => Math.min(3, value + 1))}>Pista {Math.min(3, currentHints + 1)}</button>
          </>
        ) : (
          <button className="btn" onClick={continueLesson}>{isCorrect ? (index === lesson.exercises.length - 1 ? "Guardar y terminar" : "Siguiente") : "Intentar otra vez"}</button>
        )}
      </div>
      {currentHints > 0 && !checked && <div className="feedback"><strong>Pista {currentHints}</strong><p>{exercise.hints[currentHints - 1]}</p></div>}
    </section>
  );
}
