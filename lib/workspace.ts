import 'server-only';
import { db } from './db';
import { account, AccessError } from './access';
import { chileToday } from './ledger';
import { subscriptionUsable } from './plans';

export async function getWorkspace(selected?: string) {
  const user = await account();
  let workspace;
  if (selected) {
    workspace = await db.workspace.findFirst({ where: { id: selected, ...(user.role === 'ADMIN' ? {} : { members: { some: { userId: user.id } } }) } });
    if (!workspace) throw new AccessError('No tienes acceso a esta inmobiliaria.');
  } else {
    const member = await db.membership.findFirst({ where: { userId: user.id }, include: { workspace: true }, orderBy: { id: 'asc' } });
    if (member) workspace = member.workspace;
    else {
      workspace = await db.workspace.upsert({ where: { clerkUserId: user.clerkUserId }, create: { clerkUserId: user.clerkUserId, members: { create: { userId: user.id } }, subscription: { create: {currentPeriodEnd:new Date(Date.now()+30*86400000)} } }, update: {} });
      await db.membership.upsert({ where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } }, create: { userId: user.id, workspaceId: workspace.id }, update: {} });
    }
  }
  if (workspace.status !== 'ACTIVE' && user.role !== 'ADMIN') throw new AccessError('Esta inmobiliaria está suspendida.');
  const subscription = await db.subscription.upsert({ where: { workspaceId: workspace.id }, create:{workspaceId:workspace.id,currentPeriodEnd:new Date(Date.now()+30*86400000)},update:{} });
  if (user.role !== 'ADMIN' && !subscriptionUsable(subscription.status,subscription.currentPeriodEnd?.toISOString().slice(0,10)||null,chileToday())) throw new AccessError('La suscripción requiere revisión del administrador.');
  return workspace;
}
