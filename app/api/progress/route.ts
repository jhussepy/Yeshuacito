import { NextResponse } from "next/server";
import { z } from "zod";
import type { Exercise, Prisma } from "@prisma/client";
import { calculateXP, starsForAccuracy } from "@/features/gamification/engine";
import { updateMastery } from "@/features/progress/mastery";
import { prisma } from "@/lib/prisma";

type AnswerInput = {
  exerciseId: string;
  answer: string;
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
};

type AttemptInput = {
  lessonId: string;
  correct: number;
  total: number;
  difficulty: number;
  responseMs: number;
  hints: number;
  answers: AnswerInput[];
};

const answerSchema = z.object({
  exerciseId: z.string().min(1).max(100),
  answer: z.string().max(500),
  correct: z.boolean(),
  responseMs: z.number().int().positive().max(3_600_000),
  hintsUsed: z.number().int().min(0).max(3),
});

const attemptSchema = z
  .object({
    lessonId: z.string().min(1).max(80),
    correct: z.number().int().nonnegative(),
    total: z.number().int().positive().max(100),
    difficulty: z.number().int().min(1).max(5),
    responseMs: z.number().int().positive().max(3_600_000),
    hints: z.number().int().min(0).max(30),
    answers: z.array(answerSchema).min(1).max(100),
  })
  .refine((value: AttemptInput) => value.correct <= value.total, {
    message: "correct no puede superar total",
  })
  .refine((value: AttemptInput) => value.answers.length === value.total, {
    message: "El detalle de respuestas debe coincidir con el total",
  });

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de intento inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input: AttemptInput = parsed.data;
  const lesson = await prisma.lesson.findFirst({
    where: { slug: input.lessonId },
    include: { unit: { include: { world: { include: { course: true } } } }, exercises: true },
  });
  const student = await prisma.studentProfile.findFirst({
    where: { user: { email: "alex.demo@nexora.local" } },
    include: { streak: true },
  });

  if (!lesson || !student) {
    return NextResponse.json(
      { error: "La lección o el perfil demo no están disponibles. Ejecuta npm run db:seed." },
      { status: 404 },
    );
  }

  const exerciseByKey = new Map<string, Exercise>(
    lesson.exercises.map((exercise: Exercise) => [exercise.contentKey, exercise]),
  );
  if (input.answers.some((answer: AnswerInput) => !exerciseByKey.has(answer.exerciseId))) {
    return NextResponse.json({ error: "El intento contiene ejercicios ajenos a la lección." }, { status: 400 });
  }
  const normalizedAnswers = input.answers.map((answer: AnswerInput) => {
    const expected = exerciseByKey.get(answer.exerciseId)!.correctAnswer.trim().toLocaleLowerCase();
    const correct = answer.answer.trim().toLocaleLowerCase() === expected;
    return { ...answer, correct };
  });
  const verifiedCorrect = normalizedAnswers.filter((answer: AnswerInput) => answer.correct).length;
  if (verifiedCorrect !== input.correct) {
    return NextResponse.json({ error: "El resumen no coincide con las respuestas verificadas." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [priorCompletions, currentMastery, progress] = await Promise.all([
      tx.lessonAttempt.count({
        where: { studentId: student.id, lessonId: lesson.id, status: "COMPLETED" },
      }),
      tx.skillMastery.findUnique({
        where: { studentId_skillKey: { studentId: student.id, skillKey: lesson.unit.skillKey } },
      }),
      tx.studentProgress.findUnique({
        where: { studentId_courseId: { studentId: student.id, courseId: lesson.unit.world.course.id } },
      }),
    ]);

    if (!progress) throw new Error("No existe progreso para este curso");

    const accuracy = input.correct / input.total;
    const xp = calculateXP({
      correct: input.correct,
      total: input.total,
      difficulty: input.difficulty,
      completed: true,
      streak: student.streak?.current ?? 0,
      priorCompletions,
    });
    const mastery = updateMastery(
      currentMastery?.score ?? progress.mastery,
      accuracy >= 0.7,
      input.difficulty,
      input.responseMs,
      input.hints,
    );

    const lessonAttempt = await tx.lessonAttempt.create({
      data: {
        studentId: student.id,
        lessonId: lesson.id,
        status: "COMPLETED",
        correct: input.correct,
        total: input.total,
        stars: starsForAccuracy(accuracy),
        xpEarned: xp,
        durationSeconds: Math.max(1, Math.round(input.responseMs / 1000)),
        completedAt: new Date(),
        questionAttempts: {
          create: normalizedAnswers.map((answer: AnswerInput) => ({
            exerciseId: exerciseByKey.get(answer.exerciseId)!.id,
            answer: answer.answer,
            correct: answer.correct,
            responseMs: answer.responseMs,
            hintsUsed: answer.hintsUsed,
          })),
        },
      },
    });

    await tx.skillMastery.upsert({
      where: { studentId_skillKey: { studentId: student.id, skillKey: lesson.unit.skillKey } },
      create: {
        studentId: student.id,
        skillKey: lesson.unit.skillKey,
        score: mastery,
        attempts: input.total,
        correct: input.correct,
        lastPracticedAt: new Date(),
      },
      update: {
        score: mastery,
        attempts: { increment: input.total },
        correct: { increment: input.correct },
        lastPracticedAt: new Date(),
      },
    });
    await tx.studentProgress.update({
      where: { id: progress.id },
      data: {
        xp: { increment: xp },
        mastery,
        completedLessons: { increment: priorCompletions === 0 ? 1 : 0 },
      },
    });
    await tx.xPTransaction.create({
      data: { studentId: student.id, amount: xp, reason: "LESSON_COMPLETED", sourceId: lessonAttempt.id },
    });

    return { attemptId: lessonAttempt.id, xp, mastery, stars: starsForAccuracy(accuracy), accuracy };
  });

  return NextResponse.json(result, { status: 201 });
}
