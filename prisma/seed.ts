import {PrismaClient,CourseKind,Role} from "@prisma/client";import {courses} from "../data/courses";
const prisma=new PrismaClient();
async function main(){await prisma.questionAttempt.deleteMany();await prisma.lessonAttempt.deleteMany();await prisma.exercise.deleteMany();await prisma.lesson.deleteMany();await prisma.unit.deleteMany();await prisma.world.deleteMany();await prisma.studentProgress.deleteMany();await prisma.course.deleteMany();
 const studentUser=await prisma.user.upsert({where:{email:"alex.demo@nexora.local"},update:{},create:{email:"alex.demo@nexora.local",role:Role.STUDENT,student:{create:{displayName:"Alex",birthYear:2018,streak:{create:{current:12,longest:12,lastActivityDate:new Date()}},tradingAccount:{create:{}}}},settings:{create:{language:"es",dailyGoalMinutes:20}}},include:{student:true}});
 const parentUser=await prisma.user.upsert({where:{email:"tutor.demo@nexora.local"},update:{},create:{email:"tutor.demo@nexora.local",role:Role.PARENT,parent:{create:{displayName:"Tutor de Alex"}},settings:{create:{language:"es"}}},include:{parent:true}});
 if(studentUser.student&&parentUser.parent)await prisma.parentStudentRelationship.upsert({where:{parentId_studentId:{parentId:parentUser.parent.id,studentId:studentUser.student.id}},update:{},create:{parentId:parentUser.parent.id,studentId:studentUser.student.id}});
 const kind={matematicas:CourseKind.MATH,english:CourseKind.ENGLISH,finanzas:CourseKind.FINANCE,trading:CourseKind.TRADING} as const;
 for (const c of courses) {
  const worlds = c.worlds.map((w, wi) => ({
   title: w.title, description: w.description, order: wi,
   units: { create: [{
    title: w.title, skillKey: w.id, order: 0, prerequisiteMastery: wi ? 80 : 0,
    lessons: { create: w.lessons.map((l, li) => ({
     slug: l.id, title: l.title, summary: l.summary, concept: l.concept,
     visualExample: l.example, order: li, xpReward: l.xp,
     exercises: { create: l.exercises.map(e => ({
      contentKey: e.id, type: e.type, prompt: e.prompt, difficulty: e.difficulty,
      options: e.options ?? undefined, correctAnswer: e.answer,
      explanation: e.explanation, hints: e.hints
     })) }
    })) }
   }] }
  }));
  const dbCourse = await prisma.course.create({ data: {
   slug: c.slug, kind: kind[c.slug], title: c.title, description: c.subtitle,
   order: courses.indexOf(c), worlds: { create: worlds }
  }});
  if (studentUser.student) {
   const values = { matematicas:[14,2850,82], english:[6,1240,71], finanzas:[4,780,64], trading:[3,520,58] }[c.slug];
   await prisma.studentProgress.create({ data: { studentId:studentUser.student.id, courseId:dbCourse.id, level:values[0], xp:values[1], mastery:values[2], completedLessons:Math.floor(values[2]/10) }});
  }
 }
 for(const a of [{key:"quick-mind",title:"Mente rápida",description:"20 respuestas correctas",icon:"⚡"},{key:"english-explorer",title:"English Explorer",description:"Primer mundo completado",icon:"🧭"},{key:"disciplined-trader",title:"Trader disciplinado",description:"10 operaciones con riesgo respetado",icon:"🛡️"}])await prisma.achievement.upsert({where:{key:a.key},update:a,create:a});
 await prisma.tradingScenario.upsert({where:{slug:"trend-pullback"},update:{},create:{slug:"trend-pullback",title:"Tendencia con retroceso",description:"Practica riesgo y estructura",difficulty:2,marketData:{candles:[30,42,35,57,48,65,72]}}});
 console.log(`Seed listo: ${courses.reduce((n,c)=>n+c.worlds.reduce((m,w)=>m+w.lessons.length,0),0)} lecciones para Alex.`)}
main().finally(()=>prisma.$disconnect());
