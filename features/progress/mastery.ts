export type MasteryBand="Necesita refuerzo"|"En progreso"|"Competente"|"Dominado"|"Maestría";
export function masteryBand(score:number):MasteryBand { if(score<40)return "Necesita refuerzo";if(score<70)return "En progreso";if(score<85)return "Competente";if(score<95)return "Dominado";return "Maestría" }
export function updateMastery(current:number, correct:boolean, difficulty:number, responseMs:number, hints=0):number {
 const expectedMs=22000; const speed=Math.max(.65,Math.min(1.15,expectedMs/Math.max(responseMs,4000)));
 const delta=correct?(3+difficulty*1.5)*speed-Math.min(hints,3)*.6:-(4+difficulty*1.25);
 return Math.round(Math.max(0,Math.min(100,current+delta))*10)/10;
}
export function adaptiveDifficulty(score:number, recentErrors:number){ if(score>90&&recentErrors===0)return 5;if(score<60||recentErrors>=2)return 1;return score>=75?3:2 }
