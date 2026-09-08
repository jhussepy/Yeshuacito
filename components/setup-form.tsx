"use client";

import { FormEvent, useState } from "react";

export function SetupForm() {
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/setup/seed", {
        method: "POST",
        headers: { "x-setup-secret": secret },
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      setSuccess(response.ok);
      setMessage(payload.message ?? payload.error ?? "Respuesta inesperada del servidor.");
      if (response.ok) setSecret("");
    } catch {
      setMessage("No se pudo contactar al servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 620 }} onSubmit={submit}>
      <span className="eyebrow">Inicialización única</span>
      <h1>Preparar datos demo</h1>
      <p className="muted">
        Usa esta pantalla únicamente después de ejecutar el SQL inicial en Supabase. El proceso es idempotente y no borra progreso existente.
      </p>
      <div className="field">
        <label htmlFor="setup-secret">Código SETUP_SECRET</label>
        <input
          id="setup-secret"
          type="password"
          autoComplete="off"
          minLength={32}
          required
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
      </div>
      <button className="btn" disabled={loading || secret.length < 32}>
        {loading ? "Preparando…" : "Cargar Alex y las lecciones"}
      </button>
      {message && <div className={`feedback ${success ? "good" : "try"}`} role="status">{message}</div>}
    </form>
  );
}
