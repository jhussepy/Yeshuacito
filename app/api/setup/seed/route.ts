import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { seedDemoDatabase } from "@/services/demo-seed";
import { isEnabled } from "@/lib/environment";
import { databaseSetupError } from "@/features/setup/database-error";

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

  // NEXT_PUBLIC_DEMO_MODE is retained temporarily for existing deployments.
  const demoMode = process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE;
  if (!isEnabled(demoMode)) {
    return NextResponse.json(
      {
        error:
          "El modo demo no está habilitado. En Vercel configura DEMO_MODE con el valor true para Production y vuelve a desplegar.",
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
      { error: databaseSetupError(error) },
      { status: 500 },
    );
  }
}
