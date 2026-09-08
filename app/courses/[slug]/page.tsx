import Link from "next/link";
import { ArrowLeft, LockKeyhole, Play } from "lucide-react";
import { notFound } from "next/navigation";
import { getCourse } from "@/data/courses";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEMO_STUDENT_EMAIL = "alex.demo@nexora.local";
const REQUIRED_MASTERY = 80;

type PersistedCourseState = {
  mastery: number;
  completedLessons: number;
  skillMastery: Map<string, number>;
  lessonStars: Map<string, number>;
};

async function getPersistedCourseState(slug: string): Promise<PersistedCourseState | null> {
  try {
    const student = await prisma.studentProfile.findFirst({
      where: { user: { email: DEMO_STUDENT_EMAIL } },
      include: {
        progress: { where: { course: { slug } } },
        mastery: true,
        attempts: {
          where: { status: "COMPLETED", lesson: { unit: { world: { course: { slug } } } } },
          select: { stars: true, lesson: { select: { slug: true } } },
        },
      },
    });
    const progress = student?.progress[0];
    if (!student || !progress) return null;

    const lessonStars = new Map<string, number>();
    for (const attempt of student.attempts) {
      lessonStars.set(attempt.lesson.slug, Math.max(lessonStars.get(attempt.lesson.slug) ?? 0, attempt.stars));
    }

    return {
      mastery: progress.mastery,
      completedLessons: progress.completedLessons,
      skillMastery: new Map(student.mastery.map((skill) => [skill.skillKey, skill.score])),
      lessonStars,
    };
  } catch (error) {
    console.error("Unable to load persisted course progress", error);
    return null;
  }
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const state = await getPersistedCourseState(slug);
  const totalLessons = course.worlds.reduce((total, world) => total + world.lessons.length, 0);
  const courseCompletion = state ? Math.min(100, Math.round((state.completedLessons / totalLessons) * 100)) : 0;

  return (
    <>
      <header className="topbar">
        <Link href="/" className="btn secondary"><ArrowLeft size={17} />Inicio</Link>
        <span className="pill">{Math.round(state?.mastery ?? 0)}% dominio</span>
      </header>
      {!state && (
        <div className="feedback try" role="status">
          El progreso persistente no está disponible. El mapa permanece en modo seguro hasta conectar y sembrar la base de datos.
        </div>
      )}
      <section className={`course-card ${course.color}`} style={{ minHeight: 180 }}>
        <div>
          <span className="eyebrow" style={{ color: "white" }}>MAPA DE APRENDIZAJE</span>
          <h1 style={{ fontSize: 36, margin: "7px 0" }}>{course.title}</h1>
          <p>{course.subtitle}</p>
        </div>
        <div className="progress" aria-label={`${courseCompletion}% del curso completado`}>
          <span style={{ width: `${courseCompletion}%` }} />
        </div>
      </section>
      <div className="section-head">
        <div><span className="eyebrow">Progreso por dominio</span><h2>Tu siguiente horizonte</h2></div>
        <button className="btn secondary">Descubre tu nivel</button>
      </div>
      {course.worlds.map((world, worldIndex) => {
        const previousWorld = course.worlds[worldIndex - 1];
        const previousMastery = previousWorld ? state?.skillMastery.get(previousWorld.id) ?? 0 : 100;
        const locked = worldIndex > 0 && previousMastery < REQUIRED_MASTERY;
        const worldMastery = state?.skillMastery.get(world.id) ?? 0;

        return (
          <section className="card world" key={world.id}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span className="icon-box">{world.icon}</span>
              <div>
                <span className="eyebrow">Mundo {worldIndex + 1} · {Math.round(worldMastery)}% dominio</span>
                <h2 style={{ margin: "3px 0" }}>{world.title}</h2>
                <span className="muted">{world.description}</span>
              </div>
            </div>
            <div className="lesson-map">
              {world.lessons.map((lesson) => {
                const stars = state?.lessonStars.get(lesson.id) ?? 0;
                if (locked) {
                  return (
                    <div className="lesson-node" key={lesson.id} style={{ opacity: 0.6 }}>
                      <LockKeyhole size={19} />
                      <h3>{lesson.title}</h3>
                      <small className="muted">Requiere {REQUIRED_MASTERY}% en {previousWorld?.title ?? "el mundo anterior"} · actual {Math.round(previousMastery)}%</small>
                    </div>
                  );
                }
                return (
                  <Link className="lesson-node" href={`/lesson/${lesson.id}`} key={lesson.id}>
                    <Play size={19} color="var(--brand)" />
                    <h3>{lesson.title}</h3>
                    <div className="stars" aria-label={`${stars} de 3 estrellas`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</div>
                    <small className="muted">{lesson.xp} XP · {lesson.exercises.length} retos</small>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
