const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  P1000:
    "Supabase rechazó el usuario o la contraseña. Actualiza DATABASE_URL en Vercel con la contraseña vigente y vuelve a desplegar.",
  P1001:
    "Vercel no pudo alcanzar Supabase. Revisa el host y el puerto 6543 del Transaction pooler en DATABASE_URL.",
  P1002: "Supabase tardó demasiado en responder. Espera un minuto e inténtalo nuevamente.",
  P1010: "El usuario configurado en DATABASE_URL no tiene acceso a la base de datos.",
  P2021:
    "Falta una tabla en Supabase. Ejecuta completo prisma/bootstrap/001_initial.sql en SQL Editor y vuelve a intentarlo.",
  P2022:
    "Falta una columna en Supabase. El esquema instalado está desactualizado; ejecuta el SQL bootstrap correspondiente a esta versión.",
};

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { code?: unknown; errorCode?: unknown };
  if (typeof candidate.code === "string") return candidate.code;
  return typeof candidate.errorCode === "string" ? candidate.errorCode : undefined;
}

export function databaseSetupError(error: unknown): string {
  const code = readErrorCode(error);
  if (code && DATABASE_ERROR_MESSAGES[code]) {
    return `${DATABASE_ERROR_MESSAGES[code]} (Código ${code})`;
  }
  return "No se pudo cargar la demo. Abre Vercel → Logs → Runtime Logs y busca “Web seed failed” para identificar el error de Supabase.";
}
