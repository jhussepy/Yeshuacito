export type TradeDirection = "BUY" | "SELL";
export type TradePlan = {
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
};
export type TradePlanValidation = { valid: true } | { valid: false; message: string };

function positive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} debe ser positivo`);
}

export function validateTradePlan(plan: TradePlan): TradePlanValidation {
  const { direction, entry, stopLoss, takeProfit } = plan;
  if (![entry, stopLoss, takeProfit].every((value) => Number.isFinite(value) && value > 0)) {
    return { valid: false, message: "Entrada, stop y objetivo deben ser precios positivos." };
  }
  if (direction === "BUY" && !(stopLoss < entry && entry < takeProfit)) {
    return { valid: false, message: "En BUY, el stop debe estar debajo de la entrada y el objetivo por encima." };
  }
  if (direction === "SELL" && !(takeProfit < entry && entry < stopLoss)) {
    return { valid: false, message: "En SELL, el objetivo debe estar debajo de la entrada y el stop por encima." };
  }
  return { valid: true };
}

export function calculateRisk(balance: number, riskPercent: number) {
  positive(balance, "balance");
  if (riskPercent <= 0 || riskPercent > 5) throw new Error("El riesgo debe estar entre 0% y 5%");
  return balance * riskPercent / 100;
}

export function calculatePositionSize(balance: number, riskPercent: number, entry: number, stopLoss: number) {
  const distance = Math.abs(entry - stopLoss);
  positive(distance, "distancia al stop");
  return calculateRisk(balance, riskPercent) / distance;
}

export function calculateReward(entry: number, takeProfit: number, size: number) {
  positive(size, "posición");
  return Math.abs(takeProfit - entry) * size;
}

export function calculateRR(plan: TradePlan) {
  const validation = validateTradePlan(plan);
  if (!validation.valid) throw new Error(validation.message);
  return Math.abs(plan.takeProfit - plan.entry) / Math.abs(plan.entry - plan.stopLoss);
}

export function calculatePnL(direction: TradeDirection, entry: number, exit: number, size: number) {
  positive(size, "posición");
  return (direction === "BUY" ? exit - entry : entry - exit) * size;
}

export function calculateDrawdown(peak: number, equity: number) {
  positive(peak, "máximo");
  return Math.max(0, (peak - equity) / peak * 100);
}

export function processXP(options: { hasStop: boolean; riskPercent: number; followedPlan: boolean; pnl: number }) {
  let xp = options.hasStop ? 25 : 0;
  xp += options.riskPercent <= 1 ? 20 : options.riskPercent <= 2 ? 10 : 0;
  xp += options.followedPlan ? 25 : 0;
  xp += options.pnl > 0 ? 10 : 5;
  return xp;
}
