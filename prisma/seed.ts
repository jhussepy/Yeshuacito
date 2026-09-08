import { CourseKind, PrismaClient, Role } from "@prisma/client";
import { courses } from "../data/courses";

const prisma = new PrismaClient();
const DEMO_STUDENT_EMAIL = "alex.demo@nexora.local";
const DEMO_PARENT_EMAIL = "tutor.demo@nexora.local";

const courseKind = {
  matematicas: CourseKind.MATH,
  english: CourseKind.ENGLISH,
  finanzas: CourseKind.FINANCE,
  trading: CourseKind.TRADING,
} as const;

const initialProgress = {
  matematicas: { level: 14, xp: 2_850, mastery: 82 },
  english: { level: 6, xp: 1_240, mastery: 71 },
  finanzas: { level: 4, xp: 780, mastery: 64 },
  trading: { level: 3, xp: 520, mastery: 58 },
} as const;

async function seedDemoProfiles() {
  const studentUser = await prisma.user.upsert({
    where: { email: DEMO_STUDENT_EMAIL },
    update: {},
    create: {
      email: DEMO_STUDENT_EMAIL,
      role: Role.STUDENT,
      student: {
        create: {
          displayName: "Alex",
          birthYear: 2018,
          streak: { create: { current: 12, longest: 12, lastActivityDate: new Date() } },
          tradingAccount: { create: {} },
        },
      },
      settings: { create: { language: "es", dailyGoalMinutes: 20 } },
    },
    include: { student: true },
  });
  const parentUser = await prisma.user.upsert({
    where: { email: DEMO_PARENT_EMAIL },
    update: {},
    create: {
      email: DEMO_PARENT_EMAIL,
      role: Role.PARENT,
      parent: { create: { displayName: "Tutor de Alex" } },
      settings: { create: { language: "es" } },
    },
    include: { parent: true },
  });

  if (!studentUser.student || !parentUser.parent) {
    throw new Error("Los usuarios demo existen pero sus perfiles no están disponibles");
  }

  await prisma.parentStudentRelationship.upsert({
    where: {
      parentId_studentId: {
        parentId: parentUser.parent.id,
        studentId: studentUser.student.id,
      },
    },
    update: {},
    create: {
      parentId: parentUser.parent.id,
      studentId: studentUser.student.id,
    },
  });

  return studentUser.student;
}

async function seedCurriculum(studentId: string) {
  for (const [courseOrder, course] of courses.entries()) {
    const persistedCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        kind: courseKind[course.slug],
        title: course.title,
        description: course.subtitle,
        order: courseOrder,
      },
      create: {
        slug: course.slug,
        kind: courseKind[course.slug],
        title: course.title,
        description: course.subtitle,
        order: courseOrder,
      },
    });

    for (const [worldOrder, world] of course.worlds.entries()) {
      const persistedWorld = await prisma.world.upsert({
        where: { courseId_order: { courseId: persistedCourse.id, order: worldOrder } },
        update: { title: world.title, description: world.description },
        create: {
          courseId: persistedCourse.id,
          title: world.title,
          description: world.description,
          order: worldOrder,
        },
      });
      const unit = await prisma.unit.upsert({
        where: { worldId_order: { worldId: persistedWorld.id, order: 0 } },
        update: {
          title: world.title,
          skillKey: world.id,
          prerequisiteMastery: worldOrder === 0 ? 0 : 80,
        },
        create: {
          worldId: persistedWorld.id,
          title: world.title,
          skillKey: world.id,
          order: 0,
          prerequisiteMastery: worldOrder === 0 ? 0 : 80,
        },
      });

      for (const [lessonOrder, lesson] of world.lessons.entries()) {
        const persistedLesson = await prisma.lesson.upsert({
          where: { unitId_slug: { unitId: unit.id, slug: lesson.id } },
          update: {
            title: lesson.title,
            summary: lesson.summary,
            concept: lesson.concept,
            visualExample: lesson.example,
            order: lessonOrder,
            xpReward: lesson.xp,
          },
          create: {
            unitId: unit.id,
            slug: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            concept: lesson.concept,
            visualExample: lesson.example,
            order: lessonOrder,
            xpReward: lesson.xp,
          },
        });

        for (const [exerciseOrder, exercise] of lesson.exercises.entries()) {
          await prisma.exercise.upsert({
            where: { contentKey: exercise.id },
            update: {
              lessonId: persistedLesson.id,
              order: exerciseOrder,
              type: exercise.type,
              prompt: exercise.prompt,
              difficulty: exercise.difficulty,
              options: exercise.options ?? undefined,
              correctAnswer: exercise.answer,
              explanation: exercise.explanation,
              hints: exercise.hints,
            },
            create: {
              contentKey: exercise.id,
              lessonId: persistedLesson.id,
              order: exerciseOrder,
              type: exercise.type,
              prompt: exercise.prompt,
              difficulty: exercise.difficulty,
              options: exercise.options ?? undefined,
              correctAnswer: exercise.answer,
              explanation: exercise.explanation,
              hints: exercise.hints,
            },
          });
        }
      }

      const courseMastery = initialProgress[course.slug].mastery;
      const initialWorldMastery = Math.max(0, Math.min(100, courseMastery - worldOrder * 8));
      await prisma.skillMastery.upsert({
        where: { studentId_skillKey: { studentId, skillKey: world.id } },
        update: {},
        create: {
          studentId,
          skillKey: world.id,
          score: initialWorldMastery,
          attempts: 0,
          correct: 0,
        },
      });
    }

    const defaults = initialProgress[course.slug];
    await prisma.studentProgress.upsert({
      where: { studentId_courseId: { studentId, courseId: persistedCourse.id } },
      update: {},
      create: {
        studentId,
        courseId: persistedCourse.id,
        level: defaults.level,
        xp: defaults.xp,
        mastery: defaults.mastery,
        completedLessons: Math.floor(defaults.mastery / 10),
      },
    });
  }
}

async function seedReferenceData() {
  const achievements = [
    { key: "quick-mind", title: "Mente rápida", description: "20 respuestas correctas", icon: "⚡" },
    { key: "english-explorer", title: "English Explorer", description: "Primer mundo completado", icon: "🧭" },
    { key: "disciplined-trader", title: "Trader disciplinado", description: "10 operaciones con riesgo respetado", icon: "🛡️" },
  ];
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }
  await prisma.tradingScenario.upsert({
    where: { slug: "trend-pullback" },
    update: {
      title: "Tendencia con retroceso",
      description: "Practica riesgo y estructura",
      difficulty: 2,
      marketData: { candles: [30, 42, 35, 57, 48, 65, 72] },
    },
    create: {
      slug: "trend-pullback",
      title: "Tendencia con retroceso",
      description: "Practica riesgo y estructura",
      difficulty: 2,
      marketData: { candles: [30, 42, 35, 57, 48, 65, 72] },
    },
  });
}

async function main() {
  const student = await seedDemoProfiles();
  await seedCurriculum(student.id);
  await seedReferenceData();
  const lessonCount = courses.reduce(
    (total, course) => total + course.worlds.reduce((worldTotal, world) => worldTotal + world.lessons.length, 0),
    0,
  );
  console.log(`Seed no destructivo listo: ${lessonCount} lecciones para Alex.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
