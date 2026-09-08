export interface XPInput { correct:number; total:number; difficulty:number; completed:boolean; streak:number; priorCompletions?:number }
export function calculateXP(input:XPInput):number {
  if(input.total<=0) return 0;
  const accuracy=input.correct/input.total;
  const answerXP=input.correct*(input.difficulty>=4?20:10);
  const completion=input.completed?50:0;
  const perfect=input.completed&&accuracy===1?30:0;
  const streak=Math.min(Math.max(input.streak,0)*2,20);
  const repeatFactor=input.priorCompletions?Math.max(.2,1-input.priorCompletions*.2):1;
  return Math.round((answerXP+completion+perfect+streak)*repeatFactor);
}
export function levelFromXP(xp:number){ return Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/100))+1) }
export function starsForAccuracy(accuracy:number){ return accuracy>=.9?3:accuracy>=.7?2:accuracy>0?1:0 }
