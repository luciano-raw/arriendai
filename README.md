# ArriendAI

MVP de gestión inmobiliaria para Chile. Next.js App Router, React, TypeScript, Tailwind CSS, Clerk, Prisma y PostgreSQL en Supabase.

## Desarrollo local

1. Copiar `.env.example` a `.env.local` y completar las conexiones PostgreSQL y las claves de desarrollo de la aplicación seleccionada de Clerk.
2. Ejecutar `npm ci`.
3. Ejecutar `npm run db:migrate` para aplicar migraciones pendientes.
4. Ejecutar `npm run dev` y abrir http://localhost:3000. Se usa el mismo host que Clerk en desarrollo para evitar errores de resolución IPv4/IPv6.

La ruta `/` dirige a `/cartera`; todo dato operativo requiere sesión y correo principal verificado en Clerk. `/admin` administra usuarios, inmobiliarias y suscripciones; solamente admite usuarios con rol ADMIN en PostgreSQL. Ya no hay pantallas con datos locales de ejemplo.

## Cuenta administradora y demostración

`npm run db:seed-demo` prepara una inmobiliaria marcada como demostración con 5 propiedades, 8 contactos, 3 contratos, 18 cargos y 18 pagos durante seis meses. Todos son registros persistentes y modificables por las operaciones implementadas. La carga es idempotente y no restablece los cambios del usuario.

El correo confirmado `luciano.raw04@gmail.com` tiene una reserva de alta administrativa en `AdminGrant`. Si todavía no existe en Clerk, debe registrarse desde `/sign-up` y verificar su correo. En su primer acceso verificado se asigna ADMIN a su identificador real de Clerk, se consume la reserva una sola vez y se asocia la inmobiliaria de demostración. No se inventa una identidad ni se omite la verificación del correo. El correo de reserva se prepara mediante el script, nunca mediante un endpoint público.

La administración permite registrar inmobiliarias, asociar usuarios existentes, cambiar roles, suspender cuentas e inmobiliarias y editar planes, límites y vigencias. Los usuarios aparecen después de su primer acceso verificado. Las suscripciones son manuales: no realizan cobros ni crean acuerdos con una pasarela.

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
npm test
npm run test:db
```

`test:db` prueba las funciones de negocio reales: abonos, rechazo de sobrepagos, reintentos idempotentes, límites de plan, contratos sin superposición y rechazo de registros de otra inmobiliaria. Los datos de prueba se revierten en una transacción. `npm test` verifica saldo, morosidad y fecha de Santiago. `node scripts/check-http.mjs` comprueba redirecciones y rechazo de solicitudes sin sesión contra localhost en ejecución. El primer inicio de sesión interactivo debe verificarse con el usuario.

Se usa Webpack porque Turbopack presentó un fallo al iniciar procesos PostCSS en este entorno Windows.

## Preparación para Vercel

Importar este repositorio como proyecto Next.js. Configurar las cuatro variables anteriores para el entorno elegido, usar Node.js 22.12 o superior compatible con Prisma 7 y ejecutar el build predeterminado `npm run build`. El cliente de Prisma se genera durante instalación y build. Ejecutar `npm run db:migrate` desde un entorno autorizado antes de una versión con cambios de esquema; el build no modifica la base de datos.

Para producción, configurar la instancia de producción y dominios de Clerk, con sus propias claves. Probar acceso y persistencia en una Preview antes de usar datos reales.

## Alcance y aislamiento

Las cuentas verificadas se registran en AppUser. Membership relaciona usuarios con inmobiliarias; ADMIN puede administrar la plataforma y abrir sus carteras. Cada solicitud de datos y escritura valida identidad, rol, membresía y estado en el servidor. Los usuarios normales no pueden abrir una inmobiliaria ajena y las cuentas suspendidas no acceden a los datos. El acceso normal requiere una suscripción vigente si está configurada. Las tablas tienen RLS habilitado y sin políticas de acceso directo para clientes Supabase. No se habilitó Clerk Organizations: la membresía operativa se gestiona en PostgreSQL.

La cartera permite altas de propiedades y contactos, contratos, cargos mensuales manuales y registro de pagos parciales/completos con referencia. El dashboard y la exportación CSV se calculan desde cargos y pagos. Los cambios financieros se serializan por inmobiliaria para evitar sobrepagos y duplicados. Todavía faltan edición/baja completa, RUT, UF, garantías, comisiones, generación mensual automática, egresos, liquidaciones, PDF y correos; ver la [checklist](docs/MVP-CHECKLIST.md).
