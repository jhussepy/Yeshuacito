import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, type Exercise } from "@prisma/client";
import { calculateXP, starsForAccuracy } from "@/features/gamification/engine";
import { updateMastery } from "@/features/progress/mastery";
import {
  validateCompletedAttempt,
  type SubmittedAnswer,
} from "@/features/assessments/attempt-validation";
import { prisma } from "@/lib/prisma";

type AttemptInput = {
  lessonId: string;
  responseMs: number;
  answers: SubmittedAnswer[];
};

const answerSchema = z.object({
  exerciseId: z.string().min(1).max(100),
  answer: z.string().max(500),
  responseMs: z.number().int().positive().max(3_600_000),
  hintsUsed: z.number().int().min(0).max(3),
}).strict();

const attemptSchema = z
  .object({
    lessonId: z.string().min(1).max(80),
    responseMs: z.number().int().positive().max(3_600_000),
    answers: z.array(answerSchema).min(1).max(60),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de intento inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input: AttemptInput = parsed.data;

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { slug: input.lessonId },
      include: {
        unit: { include: { world: { include: { course: true } } } },
        exercises: { orderBy: { order: "asc" } },
      },
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

    const validation = validateCompletedAttempt(
      lesson.exercises.map((exercise: Exercise) => ({
        id: exercise.contentKey,
        correctAnswer: exercise.correctAnswer,
        difficulty: exercise.difficulty,
      })),
      input.answers,
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    const exerciseByKey = new Map<string, Exercise>(
      lesson.exercises.map((exercise: Exercise) => [exercise.contentKey, exercise]),
    );

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

      const accuracy = validation.correct / validation.total;
      const xp = calculateXP({
        correct: validation.correct,
        total: validation.total,
        difficulty: validation.difficulty,
        completed: true,
        streak: student.streak?.current ?? 0,
        priorCompletions,
      });
      const mastery = updateMastery(
        currentMastery?.score ?? progress.mastery,
        accuracy >= 0.7,
        validation.difficulty,
        input.responseMs,
        validation.hints,
      );

      const lessonAttempt = await tx.lessonAttempt.create({
        data: {
          studentId: student.id,
          lessonId: lesson.id,
          status: "COMPLETED",
          correct: validation.correct,
          total: validation.total,
          stars: starsForAccuracy(accuracy),
          xpEarned: xp,
          durationSeconds: Math.max(1, Math.round(input.responseMs / 1000)),
          completedAt: new Date(),
          questionAttempts: {
            create: validation.answers.map((answer) => ({
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
          attempts: validation.total,
          correct: validation.correct,
          lastPracticedAt: new Date(),
        },
        update: {
          score: mastery,
          attempts: { increment: validation.total },
          correct: { increment: validation.correct },
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
  } catch (error) {
    console.error("Unable to persist lesson completion", error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: "No se pudo conectar con la base de datos. Revisa DATABASE_URL en Vercel." },
        { status: 503 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const databaseSetupErrors = new Set(["P1001", "P2021", "P2022"]);
      if (databaseSetupErrors.has(error.code)) {
        return NextResponse.json(
          { error: "La base de datos todavía no está preparada. Ejecuta npm run db:push y npm run db:seed." },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Ocurrió un error al guardar el progreso. Inténtalo nuevamente." },
      { status: 500 },
    );
  }
}
