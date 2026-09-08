function positive(value:number,name:string){if(!Number.isFinite(value)||value<=0)throw new Error(`${name} debe ser positivo`)}
export function calculateRisk(balance:number,riskPercent:number){positive(balance,"balance");if(riskPercent<=0||riskPercent>5)throw new Error("El riesgo debe estar entre 0% y 5%");return balance*riskPercent/100}
export function calculatePositionSize(balance:number,riskPercent:number,entry:number,stopLoss:number){const distance=Math.abs(entry-stopLoss);positive(distance,"distancia al stop");return calculateRisk(balance,riskPercent)/distance}
export function calculateReward(entry:number,takeProfit:number,size:number){positive(size,"posición");return Math.abs(takeProfit-entry)*size}
export function calculateRR(entry:number,stopLoss:number,takeProfit:number){const risk=Math.abs(entry-stopLoss);positive(risk,"riesgo");return Math.abs(takeProfit-entry)/risk}
export function calculatePnL(direction:"BUY"|"SELL",entry:number,exit:number,size:number){positive(size,"posición");return (direction==="BUY"?exit-entry:entry-exit)*size}
export function calculateDrawdown(peak:number,equity:number){positive(peak,"máximo");return Math.max(0,(peak-equity)/peak*100)}
export function processXP(opts:{hasStop:boolean;riskPercent:number;followedPlan:boolean;pnl:number}){let xp=opts.hasStop?25:0;xp+=opts.riskPercent<=1?20:opts.riskPercent<=2?10:0;xp+=opts.followedPlan?25:0;xp+=opts.pnl>0?10:5;return xp}
