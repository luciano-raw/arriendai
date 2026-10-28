import 'server-only';
import type { Prisma } from '@prisma/client';
import { AccessError } from './errors';
// Only called with identity and verification returned by Clerk on the server.
export async function syncIdentity(tx:Prisma.TransactionClient,identity:{clerkUserId:string;email:string;name:string;verified:boolean}){
 if(!identity.verified)throw new AccessError('Verifica tu correo principal para acceder.');
 const address=identity.email.toLowerCase();
 let user=await tx.appUser.upsert({where:{clerkUserId:identity.clerkUserId},create:{clerkUserId:identity.clerkUserId,email:address,name:identity.name},update:{email:address}});
 await tx.$queryRaw`SELECT email FROM "AdminGrant" WHERE email = ${address} FOR UPDATE`;
 const grant=await tx.adminGrant.findUnique({where:{email:address}});
 if(grant&&!grant.consumedBy){
  await tx.adminGrant.update({where:{email:address},data:{consumedBy:identity.clerkUserId}});
  user=await tx.appUser.update({where:{id:user.id},data:{role:'ADMIN'}});
  await tx.membership.upsert({where:{userId_workspaceId:{userId:user.id,workspaceId:grant.workspaceId}},create:{userId:user.id,workspaceId:grant.workspaceId},update:{}});
 }
 return user;
}
