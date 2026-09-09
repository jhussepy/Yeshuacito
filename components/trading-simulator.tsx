"use client";

import { useMemo, useState } from "react";
import {
  calculatePositionSize,
  calculateRisk,
  calculateRR,
  processXP,
  validateTradePlan,
  type TradeDirection,
} from "@/features/trading/risk";

const candles = [30, 42, 35, 57, 48, 65, 72, 62, 78, 87, 74, 92, 84, 97, 105, 91, 110, 118];

export function TradingSimulator() {
  const [entry, setEntry] = useState(105);
  const [stop, setStop] = useState(102);
  const [target, setTarget] = useState(111);
  const [risk, setRisk] = useState(1);
  const [direction, setDirection] = useState<TradeDirection>("BUY");
  const [result, setResult] = useState<string>();

  const plan = useMemo(
    () => ({ direction, entry, stopLoss: stop, takeProfit: target }),
    [direction, entry, stop, target],
  );
  const validation = useMemo(() => validateTradePlan(plan), [plan]);
  const metrics = useMemo(() => {
    if (!validation.valid) return null;
    try {
      return {
        amount: calculateRisk(10_000, risk),
        size: calculatePositionSize(10_000, risk, entry, stop),
        rr: calculateRR(plan),
      };
    } catch {
      return null;
    }
  }, [entry, plan, risk, stop, validation.valid]);

  function execute() {
    if (!metrics || !validation.valid) return;
    const simulatedExit = 103.5;
    const pnl = (direction === "BUY" ? simulatedExit - entry : entry - simulatedExit) * metrics.size;
    const xp = processXP({ hasStop: true, riskPercent: risk, followedPlan: true, pnl });
    setResult(`Escenario cerrado: ${pnl < 0 ? "pérdida" : "ganancia"} virtual de $${Math.abs(pnl).toFixed(2)} · +${xp} XP por tu proceso disciplinado.`);
  }

  return (
    <div className="trade-grid">
      <section className="card">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div><span className="eyebrow">NXR/USD · Datos locales</span><h2>Escenario: tendencia con retroceso</h2></div>
          <span className="pill">Solo simulación</span>
        </div>
        <div className="candles" aria-label="Gráfico educativo de velas simulado">
          {candles.map((height, index) => (
            <div className={`candle ${index % 4 === 0 || index % 5 === 0 ? "red" : "green"}`} style={{ transform: `translateY(${55 - height / 2}px)` }} key={index}>
              <span style={{ height: `${20 + (height % 38)}px` }} />
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 14 }}>Los gráficos muestran información pasada, nunca certeza futura. Busca estructura y define primero cuánto puedes perder.</p>
      </section>
      <aside className="card">
        <span className="eyebrow">Plan de operación</span>
        <h2>$10,000 virtuales</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button className={`btn ${direction === "SELL" ? "secondary" : ""}`} onClick={() => setDirection("BUY")}>BUY</button>
          <button className={`btn ${direction === "BUY" ? "secondary" : ""}`} onClick={() => setDirection("SELL")}>SELL</button>
        </div>
        {[
          ["Entrada", entry, setEntry],
          ["Stop loss", stop, setStop],
          ["Take profit", target, setTarget],
          ["Riesgo %", risk, setRisk],
        ].map(([label, value, setter]) => (
          <div className="field" key={label as string}>
            <label>{label as string}</label>
            <input type="number" step="0.1" value={value as number} onChange={(event) => (setter as (next: number) => void)(Number(event.target.value))} />
          </div>
        ))}
        {!validation.valid && <div className="feedback try" role="alert">{validation.message}</div>}
        {metrics && (
          <div className="notice" style={{ marginBottom: 14 }}>
            <div>Máxima pérdida: <strong>${metrics.amount.toFixed(2)}</strong></div>
            <div>Posición: <strong>{metrics.size.toFixed(2)} unidades</strong></div>
            <div>Recompensa/riesgo: <strong>{metrics.rr.toFixed(2)}R</strong></div>
          </div>
        )}
        <button className="btn" style={{ width: "100%" }} disabled={!metrics || !validation.valid} onClick={execute}>Ejecutar simulación</button>
        {result && <div className="feedback good">{result}<br /><strong>Una buena decisión puede tener un resultado negativo.</strong></div>}
      </aside>
    </div>
  );
}
