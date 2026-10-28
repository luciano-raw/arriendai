import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { AccessError } from './errors';
import { syncIdentity } from './identity';
export { AccessError } from './errors';
export async function account() {
  const { userId } = await auth();
  if (!userId) throw new AccessError('Inicia sesión para continuar.', 401);
  const profile = await currentUser();
  const email = profile?.emailAddresses.find(e => e.id === profile.primaryEmailAddressId);
  if (!email || email.verification?.status !== 'verified') throw new AccessError('Verifica tu correo principal para acceder.');
  const address = email.emailAddress.toLowerCase();
  const user = await db.$transaction(tx=>syncIdentity(tx,{clerkUserId:userId,email:address,name:[profile?.firstName,profile?.lastName].filter(Boolean).join(' ')||address,verified:email.verification?.status==='verified'}));
  if (user.status !== 'ACTIVE') throw new AccessError('Tu acceso está suspendido. Contacta al administrador.');
  return user;
}
export async function administrator() {
  const user = await account();
  if (user.role !== 'ADMIN') throw new AccessError('Esta operación requiere administración de la plataforma.');
  return user;
}
export function checkOrigin(request: Request) {
  try { const origin = new URL(request.headers.get('origin') || ''); if (['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host')) return; } catch {}
  throw new AccessError('Origen no permitido.');
}
