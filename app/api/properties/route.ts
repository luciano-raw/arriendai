import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { getWorkspace } from '../../../lib/workspace';

export const dynamic = 'force-dynamic';
const propertySchema = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(200),
  owner: z.string().trim().min(1).max(100),
  rent: z.number().int().positive().max(999999999),
  type: z.enum(['Departamento', 'Casa', 'Oficina', 'Local comercial']),
});

export async function GET() {
  try {
    const workspace = await getWorkspace();
    if (!workspace) return NextResponse.json({ error: 'Inicia sesión para acceder a tu cartera.' }, { status: 401 });
    const properties = await db.property.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(properties.map(p => ({ ...p, rent: p.rent.toNumber() })), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'No pudimos cargar tu cartera. Intenta nuevamente.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  // Next may normalize request.url to localhost internally. Compare the
  // browser origin with the incoming Host, retaining its port.
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get('origin') || '');
    sameOrigin = ['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { /* Missing or malformed Origin is rejected. */ }
  if (!sameOrigin) return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  try {
    const workspace = await getWorkspace();
    if (!workspace) return NextResponse.json({ error: 'Inicia sesión para agregar propiedades.' }, { status: 401 });
    const parsed = propertySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Revisa los campos de la propiedad.' }, { status: 400 });
    const property = await db.property.create({ data: { ...parsed.data, workspaceId: workspace.id } });
    return NextResponse.json({ ...property, rent: property.rent.toNumber() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No pudimos guardar la propiedad. Intenta nuevamente.' }, { status: 503 });
  }
}
