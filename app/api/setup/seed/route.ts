import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { seedDemoDatabase } from "@/services/demo-seed";
import { isEnabled } from "@/lib/environment";

export const runtime = "nodejs";

function matchesSecret(provided: string, expected: string) {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const expectedSecret = process.env.SETUP_SECRET;
  if (!expectedSecret || expectedSecret.length < 32) {
    return NextResponse.json({ error: "La inicialización web está desactivada." }, { status: 503 });
  }

  const providedSecret = request.headers.get("x-setup-secret") ?? "";
  if (!matchesSecret(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Código de configuración incorrecto." }, { status: 401 });
  }

  if (!isEnabled(process.env.NEXT_PUBLIC_DEMO_MODE)) {
    return NextResponse.json(
      {
        error:
          "El modo demo no está habilitado. En Vercel configura NEXT_PUBLIC_DEMO_MODE con el valor true para Production y vuelve a desplegar.",
      },
      { status: 403 },
    );
  }

  try {
    const result = await seedDemoDatabase();
    return NextResponse.json({ message: `Datos demo preparados: ${result.lessonCount} lecciones.` });
  } catch (error) {
    console.error("Web seed failed", error);
    return NextResponse.json(
      { error: "No se pudo cargar la demo. Confirma que ejecutaste el SQL inicial y revisa DATABASE_URL." },
      { status: 500 },
    );
  }
}
