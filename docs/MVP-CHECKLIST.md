# ArriendAI — checklist del MVP

## 1. Base y diseño
- [x] Next.js, React, TypeScript y Tailwind CSS.
- [x] Interfaz responsiva en español y montos CLP.
- [x] Dashboard con recaudación, saldo, morosidad y ocupación calculados desde registros.
- [x] Cartera con búsqueda, filtros y alta persistente de propiedades.
- [x] Vistas conectadas de personas, contratos, cargos y pagos.
- [x] Identificar la inmobiliaria con datos ficticios persistentes.
- [x] Identidad visual basada en referencia y selector claro/oscuro.
- [ ] Validar interfaz con el usuario.

## 2. Infraestructura y acceso
- [x] Vincular repositorio GitHub.
- [ ] Configurar despliegue en Vercel (a cargo del usuario).
- [x] Conectar Supabase PostgreSQL mediante Prisma y aplicar migración inicial.
- [x] Preparar provider, acceso, registro y rutas privadas de Clerk.
- [x] Completar claves locales de Clerk y validar acceso a la instancia.
- [ ] Verificar primer inicio de sesión interactivo con el usuario.
- [x] Membresías en PostgreSQL para asociar usuarios con inmobiliarias.
- [x] Autorizar cada lectura y escritura por inmobiliaria en el servidor.
- [x] Administrador de plataforma y usuario de inmobiliaria; prueba de aislamiento operativo.
- [x] Panel de usuarios, inmobiliarias, suspensión de accesos y suscripciones manuales.
- [x] Reserva de alta administrativa para el correo confirmado, ligada al primer acceso verificado.
- [ ] Roles granulares de ejecutivo, propietario y arrendatario.
- [ ] Validar webhooks firmados e idempotencia.

## 3. Operación del MVP
- [ ] CRUD persistente de propietarios y arrendatarios con validación de RUT.
- [x] Alta y consulta de contactos propietarios y arrendatarios.
- [ ] CRUD persistente de propiedades y asociación de propietario.
- [ ] Contratos con fechas, moneda CLP/UF, garantía y comisión.
- [x] Contratos CLP con fechas, propietario, arrendatario y validación de superposición.
- [ ] Generación idempotente de cargos mensuales y vencimientos.
- [x] Alta manual de un cargo por contrato y período, sin duplicados.
- [x] Registro manual de pagos parciales y completos; saldo y morosidad calculados.
- [ ] Ingresos, egresos y liquidaciones de propietarios.
- [ ] Comprobantes PDF y almacenamiento privado de documentos.
- [ ] Recordatorios por correo con registro de envío.
- [x] Dashboard calculado desde movimientos persistentes.
- [x] Exportación de cobranza con permisos por inmobiliaria.

## 4. Salida a piloto
- [x] Pruebas de aislamiento operativo, abonos, sobrepagos, idempotencia y fechas de Chile.
- [ ] Revisión interactiva de roles y membresías con cuentas reales del piloto.
- [ ] Copias de seguridad, monitoreo y recuperación de errores.
- [ ] Revisión de privacidad, términos y conservación de documentos.
- [ ] Alta de inmobiliaria piloto y carga inicial.
- [ ] Definir planes, límites de propiedades y cobro de suscripción.

## Después del MVP
Portales de propietarios y arrendatarios, mantenciones, pasarela de pagos, WhatsApp, compraventa y BI avanzado.

## Primer incremento conectado
La ruta `/` dirige a la cartera autenticada. `/admin` requiere rol ADMIN persistido; `/cartera` valida membresía o administración. La carga idempotente prepara registros ficticios operativos y una reserva de alta para `luciano.raw04@gmail.com`. Las cifras de la interfaz se calculan desde contratos, cargos y pagos. La administración de suscripciones define acceso, vigencia y límites, pero no procesa cobros. Clerk Organizations, portales, pagos externos, egresos y liquidaciones continúan fuera de este incremento.

## Decisiones iniciales
Una empresa contiene propiedades, personas, contratos, cargos, pagos y documentos. Toda entidad operativa tendrá un identificador de empresa. El servidor derivará la empresa desde la sesión autenticada; nunca confiará en un identificador enviado por el navegador. Los importes se almacenarán con precisión decimal y los pagos se asignarán a cargos para permitir abonos parciales. No se habilitarán operaciones reales hasta implementar autenticación y aislamiento.
