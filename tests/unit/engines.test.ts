import { describe, expect, it } from "vitest";
import { calculateXP, levelFromXP, starsForAccuracy } from "../../features/gamification/engine";
import { adaptiveDifficulty, masteryBand, updateMastery } from "../../features/progress/mastery";
import {
  calculateDrawdown,
  calculatePnL,
  calculatePositionSize,
  calculateRR,
  calculateRisk,
  processXP,
  validateTradePlan,
} from "../../features/trading/risk";
import { generateAdditionQuestion, generateEquation, generateFractionComparison, generatePercentageProblem } from "../../features/math/generators";

describe("gamificación", () => {
  it("limita bonus y reduce farming", () => {
    expect(calculateXP({ correct: 3, total: 3, difficulty: 4, completed: true, streak: 99 })).toBe(160);
    expect(calculateXP({ correct: 3, total: 3, difficulty: 4, completed: true, streak: 99, priorCompletions: 9 })).toBe(32);
  });
  it("cuenta errores iniciales para precisión, estrellas y XP", () => {
    expect(starsForAccuracy(3 / 5)).toBe(1);
    expect(calculateXP({ correct: 3, total: 5, difficulty: 2, completed: true, streak: 0 })).toBe(80);
  });
  it("calcula niveles y estrellas", () => {
    expect(levelFromXP(900)).toBe(4);
    expect(starsForAccuracy(0.91)).toBe(3);
  });
});

describe("dominio adaptativo", () => {
  it("respeta bandas y límites", () => {
    expect(masteryBand(95)).toBe("Maestría");
    expect(updateMastery(99, true, 5, 4_000)).toBe(100);
    expect(updateMastery(1, false, 5, 20_000)).toBe(0);
  });
  it("refuerza tras errores", () => expect(adaptiveDifficulty(88, 2)).toBe(1));
});

describe("riesgo", () => {
  const buyPlan = { direction: "BUY" as const, entry: 100, stopLoss: 98, takeProfit: 106 };
  it("dimensiona desde pérdida máxima", () => {
    expect(calculateRisk(10_000, 1)).toBe(100);
    expect(calculatePositionSize(10_000, 1, 100, 98)).toBe(50);
    expect(calculateRR(buyPlan)).toBe(3);
  });
  it("rechaza niveles contradictorios con BUY y SELL", () => {
    expect(validateTradePlan({ direction: "BUY", entry: 105, stopLoss: 110, takeProfit: 100 }).valid).toBe(false);
    expect(validateTradePlan({ direction: "SELL", entry: 105, stopLoss: 100, takeProfit: 110 }).valid).toBe(false);
    expect(() => calculateRR({ direction: "BUY", entry: 105, stopLoss: 110, takeProfit: 100 })).toThrow();
  });
  it("acepta la geometría correcta para SELL", () => {
    const sell = { direction: "SELL" as const, entry: 100, stopLoss: 102, takeProfit: 94 };
    expect(validateTradePlan(sell).valid).toBe(true);
    expect(calculateRR(sell)).toBe(3);
  });
  it("calcula pnl y drawdown", () => {
    expect(calculatePnL("SELL", 100, 95, 20)).toBe(100);
    expect(calculateDrawdown(10_000, 9_000)).toBe(10);
  });
  it("premia proceso sobre resultado", () => {
    expect(processXP({ hasStop: true, riskPercent: 1, followedPlan: true, pnl: -50 }))
      .toBeGreaterThan(processXP({ hasStop: false, riskPercent: 4, followedPlan: false, pnl: 100 }));
  });
});

describe("generadores matemáticos", () => {
  it("produce respuestas coherentes", () => {
    expect(generateAdditionQuestion(1).answer).toBe("15");
    expect(generateFractionComparison().answer).toBe("2/3");
    expect(generatePercentageProblem().answer).toBe("108");
    expect(generateEquation().answer).toBe("6");
  });
});
