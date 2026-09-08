export type CourseSlug = "matematicas" | "english" | "finanzas" | "trading";
export type ExerciseType = "choice" | "numeric" | "true-false" | "order" | "fill";
export interface Exercise { id:string; type:ExerciseType; prompt:string; options?:string[]; answer:string; hints:[string,string,string]; explanation:string; difficulty:1|2|3|4|5 }
export interface Lesson { id:string; title:string; summary:string; concept:string; example:string; skill:string; xp:number; exercises:Exercise[] }
export interface World { id:string; title:string; description:string; icon:string; lessons:Lesson[] }
export interface Course { slug:CourseSlug; title:string; subtitle:string; color:string; worlds:World[] }
