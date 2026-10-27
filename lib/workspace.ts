import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { db } from './db';

// MVP: una cartera privada por usuario. Las organizaciones compartidas
// requieren habilitar Clerk Organizations y migrar la membresía explícitamente.
export async function getWorkspace() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) throw new Error('Clerk no configurado');
  const { userId } = await auth();
  if (!userId) return null;
  return db.workspace.upsert({ where: { clerkUserId: userId }, create: { clerkUserId: userId }, update: {} });
}
