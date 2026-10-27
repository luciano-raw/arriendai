# ArriendAI

MVP de gestión inmobiliaria para Chile. Next.js App Router, React, TypeScript, Tailwind CSS, Clerk, Prisma y PostgreSQL en Supabase.

## Desarrollo local

1. Copiar `.env.example` a `.env.local` y completar las conexiones PostgreSQL y las claves de desarrollo de la aplicación seleccionada de Clerk.
2. Ejecutar `npm ci`.
3. Ejecutar `npm run db:migrate` para aplicar migraciones pendientes.
4. Ejecutar `npm run dev` y abrir http://127.0.0.1:3000.

La ruta `/` es una demostración con datos locales del navegador. `/sign-in` y `/sign-up` contienen Clerk; `/cartera` requiere sesión y permite listar/crear propiedades persistentes. Sin ambas claves de Clerk, la demostración sigue disponible y el acceso privado responde con indisponibilidad, nunca con datos de otra cuenta.

## Variables

- `DATABASE_URL`: pooler transaccional PostgreSQL para el runtime.
- `DIRECT_URL`: pooler de sesión para migraciones de Prisma.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: clave pública de desarrollo.
- `CLERK_SECRET_KEY`: clave privada de desarrollo, solo servidor.

No se necesita la clave service_role ni el SDK de Supabase para este incremento: Prisma conecta directamente a PostgreSQL. Nunca publicar `.env.local`. La contraseña local no forma parte del repositorio.

## Verificación

```sh
npm run typecheck
npm run build
npm run db:check
```

`db:check` verifica tablas, RLS y escritura decimal dentro de una transacción que siempre revierte los registros de prueba. También comprueba consultas de cartera por dos cuentas distintas; no reemplaza las futuras pruebas de autorización de equipos.

Se usa Webpack porque Turbopack presentó un fallo al iniciar procesos PostCSS en este entorno Windows.

## Preparación para Vercel

Importar este repositorio como proyecto Next.js. Configurar las cuatro variables anteriores para el entorno elegido, usar Node.js 22.12 o superior compatible con Prisma 7 y ejecutar el build predeterminado `npm run build`. El cliente de Prisma se genera durante instalación y build. Ejecutar `npm run db:migrate` desde un entorno autorizado antes de una versión con cambios de esquema; el build no modifica la base de datos.

Para producción, configurar la instancia de producción y dominios de Clerk, con sus propias claves. Probar acceso y persistencia en una Preview antes de usar datos reales.

## Alcance y aislamiento

Cada cuenta Clerk posee un Workspace privado; las operaciones derivan su identificador de la sesión del servidor. El navegador no puede escoger otra cuenta. Las tablas tienen RLS habilitado y sin acceso directo desde clientes Supabase. Las organizaciones compartidas, membresías y roles quedan pendientes antes del piloto con equipos.

Solo la cartera de propiedades tiene persistencia en esta etapa. Propietarios, arrendatarios, contratos, pagos, PDF y reportes financieros siguen en la [checklist](docs/MVP-CHECKLIST.md). El dashboard de demostración no representa contabilidad real.
