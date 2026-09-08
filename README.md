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
Provisiona PostgreSQL, configura variables seguras, ejecuta `prisma migrate deploy` y `npm run build`. Usa TLS, cabeceras CSP en el proxy y copias cifradas. Para producción, el siguiente incremento sustituye el selector demo por sesiones HttpOnly con credenciales parentales y códigos de acceso infantil.

### Vercel
1. Importa el repositorio y configura `DATABASE_URL`, `AUTH_SECRET` y `NEXT_PUBLIC_DEMO_MODE` en **Settings → Environment Variables**.
2. Usa `npm run build` como Build Command. El script genera Prisma Client antes de compilar Next.js; `postinstall` también lo regenera cuando Vercel instala dependencias.
3. Ejecuta `npm run db:migrate:deploy` contra la base de producción antes del primer tráfico y `npm run db:seed` solo si quieres cargar el perfil demo.
4. Tras cambiar `prisma/schema.prisma`, crea y confirma una migración local con `npm run db:migrate -- --name <cambio>` y vuelve a desplegar.

Si Vercel informa `P1012`, ejecuta `npm run db:validate` antes de volver a desplegar. El schema debe usar bloques Prisma multilínea; las declaraciones compactadas en una sola línea no son sintaxis válida.

## Privacidad y seguridad
Minimización de datos, sin publicidad, chat, brokers, dinero real, localización o rankings públicos. Las operaciones de progreso se validan en servidor; la autorización por relación tutor-estudiante debe preceder toda consulta real.

## Roadmap
Sesiones robustas, audio/pronunciación bajo consentimiento, certificados internos, más generadores, Labs de probabilidad y programación (Blockly, JavaScript, Python), sincronización offline e informes exportables para el tutor.
