# Nexora Academy

**Aprende. Piensa. Crece.** Plataforma EdTech privada y adaptativa para aprender matemáticas, inglés, finanzas y trading simulado. La V1 incluye cuatro rutas independientes, 60 lecciones con ejercicios, experiencia Focus, progreso, panel familiar, gamificación y un simulador donde se recompensa el proceso de riesgo.

## Stack
Next.js 15, React 19, TypeScript strict, Tailwind CSS 4, Prisma/PostgreSQL, Zod, next-themes, Vitest y Playwright.

## Inicio rápido
```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```
Abre `http://localhost:3000`. El modo demo presenta a Alex sin exponer datos reales.

## Scripts
- `npm run dev`, `build`, `start`: aplicación.
- `npm run lint`, `typecheck`: calidad estática.
- `npm test`: motores críticos.
- `npx playwright test`: flujo E2E.
- `npm run db:migrate`, `db:seed`: persistencia.

## Arquitectura
`app` contiene rutas y API; `components`, UI reusable; `features`, motores de dominio puros; `data`, contenido inicial estructurado; `prisma`, modelo y seed; `tests`, pruebas; `docs`, decisiones técnicas. Véase [arquitectura](docs/ARCHITECTURE.md) y [modelo de contenido](docs/CONTENT_MODEL.md).

## Variables
`DATABASE_URL` apunta a PostgreSQL; `AUTH_SECRET` debe ser aleatorio y de 32+ caracteres; `NEXT_PUBLIC_DEMO_MODE` habilita únicamente el perfil demo local. Nunca confirmar `.env`.

## Deploy
Esta V1 todavía no contiene un historial de migraciones confirmado. Por eso, preparar el schema con `db:push` es un paso **obligatorio** antes del primer despliegue; no uses `prisma migrate deploy` hasta que exista `prisma/migrations`.

### Vercel
1. Importa el repositorio y configura `DATABASE_URL`, `AUTH_SECRET` y `NEXT_PUBLIC_DEMO_MODE` en **Settings → Environment Variables**.
2. Desde una terminal segura con acceso a la misma base, ejecuta `DATABASE_URL="postgresql://..." npm run db:push`. Esto crea o sincroniza las tablas requeridas por la V1.
3. Si quieres el perfil y contenido demostrativo, ejecuta `DATABASE_URL="postgresql://..." npm run db:seed`. El seed es idempotente y no elimina cursos, intentos ni progreso de otros usuarios.
4. Usa `npm run build` como Build Command y despliega. El script genera Prisma Client antes de compilar Next.js; `postinstall` también lo regenera al instalar dependencias.
5. Tras cambios futuros del schema, crea y confirma una migración con `npm run db:migrate -- --name <cambio>`; cuando el repositorio ya contenga migraciones, producción podrá utilizar `prisma migrate deploy`.

Nunca expongas ni confirmes `DATABASE_URL`. El build no crea tablas ni carga datos automáticamente. Sin el paso 2, la interfaz puede abrir, pero no podrá guardar lecciones. Si falta el paso 3, no existirá el perfil demo de Alex.

Si Vercel informa `P1012`, ejecuta `npm run db:validate` antes de volver a desplegar. El schema debe usar bloques Prisma multilínea; las declaraciones compactadas en una sola línea no son sintaxis válida.

## Privacidad y seguridad
Minimización de datos, sin publicidad, chat, brokers, dinero real, localización o rankings públicos. Las operaciones de progreso se validan en servidor; la autorización por relación tutor-estudiante debe preceder toda consulta real.

## Roadmap
Sesiones robustas, audio/pronunciación bajo consentimiento, certificados internos, más generadores, Labs de probabilidad y programación (Blockly, JavaScript, Python), sincronización offline e informes exportables para el tutor.
