import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import assert from 'node:assert/strict';
config({ path: '.env.local', quiet: true });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }) });
const rollback = new Error('ROLLBACK_VERIFICATION');
try {
  const tables = await db.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Workspace', 'Property')`;
  assert.equal(tables.length, 2);
  assert.ok(tables.every(table => table.rowsecurity), 'RLS debe estar habilitado');
  try {
    await db.$transaction(async tx => {
      const prefix = `verification_${crypto.randomUUID()}`;
      const a = await tx.workspace.create({ data: { clerkUserId: `${prefix}_a` } });
      const b = await tx.workspace.create({ data: { clerkUserId: `${prefix}_b` } });
      const property = await tx.property.create({ data: { workspaceId: a.id, name: 'Verificación temporal', address: 'Dirección de prueba', owner: 'Propietario de prueba', type: 'Departamento', rent: 650000 } });
      assert.equal(property.rent.toNumber(), 650000);
      assert.equal((await tx.property.findMany({ where: { workspaceId: a.id } })).length, 1);
      assert.equal((await tx.property.findMany({ where: { workspaceId: b.id } })).length, 0);
      throw rollback;
    }, { timeout: 20000 });
  } catch (error) { if (error !== rollback) throw error; }
  console.log('OK: conexión PostgreSQL, tablas, RLS, persistencia decimal y consultas por cuenta. Transacción de prueba revertida.');
} catch (error) {
  console.error('Falló la verificación de base de datos:', error instanceof Error ? error.name : 'Error');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
