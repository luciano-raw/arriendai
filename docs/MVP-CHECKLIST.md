# ArriendAI — checklist del MVP

## 1. Base y diseño
- [x] Next.js, React, TypeScript y Tailwind CSS.
- [x] Interfaz responsiva en español y montos CLP.
- [x] Dashboard con indicadores y visualización de recaudación de ejemplo.
- [x] Cartera con búsqueda, filtros y alta local de propiedades.
- [x] Vistas iniciales de personas, contratos y pagos.
- [x] Identificar claramente el modo demostración.
- [x] Identidad visual basada en referencia y selector claro/oscuro.
- [ ] Validar interfaz con el usuario.

## 2. Infraestructura y acceso
- [x] Vincular repositorio GitHub.
- [ ] Configurar despliegue en Vercel (a cargo del usuario).
- [x] Conectar Supabase PostgreSQL mediante Prisma y aplicar migración inicial.
- [x] Preparar provider, acceso, registro y rutas privadas de Clerk.
- [ ] Completar claves locales de Clerk y verificar inicio de sesión real.
- [ ] Habilitar organizaciones y migrar cartera privada a equipos compartidos.
- [ ] Autorizar cada lectura y escritura por empresa activa en el servidor.
- [ ] Roles administrador y ejecutivo; probar aislamiento entre empresas.
- [ ] Validar webhooks firmados e idempotencia.

## 3. Operación del MVP
- [ ] CRUD persistente de propietarios y arrendatarios con validación de RUT.
- [ ] CRUD persistente de propiedades y asociación de propietario.
- [ ] Contratos con fechas, moneda CLP/UF, garantía y comisión.
- [ ] Generación idempotente de cargos mensuales y vencimientos.
- [ ] Registro manual de pagos parciales y completos; saldo y morosidad calculados.
- [ ] Ingresos, egresos y liquidaciones de propietarios.
- [ ] Comprobantes PDF y almacenamiento privado de documentos.
- [ ] Recordatorios por correo con registro de envío.
- [ ] Dashboard calculado desde movimientos reales.
- [ ] Exportación de reportes con permisos por empresa.

## 4. Salida a piloto
- [ ] Pruebas de permisos, pagos parciales, redondeo y fechas de Chile.
- [ ] Copias de seguridad, monitoreo y recuperación de errores.
- [ ] Revisión de privacidad, términos y conservación de documentos.
- [ ] Alta de inmobiliaria piloto y carga inicial.
- [ ] Definir planes, límites de propiedades y cobro de suscripción.

## Después del MVP
Portales de propietarios y arrendatarios, mantenciones, pasarela de pagos, WhatsApp, compraventa y BI avanzado.

## Primer incremento conectado
La ruta `/` conserva la demostración. `/cartera` requiere Clerk y permite listar y crear propiedades en Supabase. Cada usuario tiene por ahora un Workspace privado mediante su identificador de Clerk. No equivale todavía a una organización compartida: falta habilitar Organizations, roles y membresías antes del piloto multiusuario. Las tablas tienen RLS sin políticas para clientes de Supabase; solamente el backend Prisma accede con permisos de PostgreSQL y filtra por la sesión. Los contratos, personas, pagos y liquidaciones siguen pendientes como módulos persistentes.

## Decisiones iniciales
Una empresa contiene propiedades, personas, contratos, cargos, pagos y documentos. Toda entidad operativa tendrá un identificador de empresa. El servidor derivará la empresa desde la sesión autenticada; nunca confiará en un identificador enviado por el navegador. Los importes se almacenarán con precisión decimal y los pagos se asignarán a cargos para permitir abonos parciales. No se habilitarán operaciones reales hasta implementar autenticación y aislamiento.
