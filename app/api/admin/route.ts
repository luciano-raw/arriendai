import { NextResponse } from 'next/server';
import { z } from 'zod';
import { administrator, AccessError, checkOrigin } from '../../../lib/access';
import { db } from '../../../lib/db';
import { plans } from '../../../lib/plans';
const id=z.string().min(1), plan=z.enum(['INICIAL','PRO','EMPRESA']);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('workspace'),name:z.string().trim().min(2).max(100),ownerId:id,plan}),
 z.object({action:z.literal('subscription'),workspaceId:id,plan,status:z.enum(['TRIAL','ACTIVE','PAST_DUE','CANCELED']),currentPeriodEnd:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}),
 z.object({action:z.literal('user'),id,role:z.enum(['USER','ADMIN']),status:z.enum(['ACTIVE','SUSPENDED'])}),
 z.object({action:z.literal('membership'),workspaceId:id,userId:id}),
 z.object({action:z.literal('workspaceStatus'),id,status:z.enum(['ACTIVE','SUSPENDED'])}),
]);
export async function POST(request:Request){
 try{checkOrigin(request);const actor=await administrator();const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Revisa los campos.'},{status:400});const input=parsed.data;
 await db.$transaction(async tx=>{
  if(input.action==='workspace'){
   if(!await tx.appUser.findUnique({where:{id:input.ownerId}}))throw new AccessError('Usuario no disponible.',404);
   const chosen=plans[input.plan];
   await tx.workspace.create({data:{name:input.name,members:{create:{userId:input.ownerId}},subscription:{create:{plan:input.plan,monthlyPrice:chosen.monthlyPrice,propertyLimit:chosen.propertyLimit,currentPeriodEnd:new Date(Date.now()+30*86400000)}}}});
  }else if(input.action==='user'){
   await tx.$queryRaw`SELECT id FROM "AppUser" WHERE role = 'ADMIN' FOR UPDATE`;
   const target=await tx.appUser.findUnique({where:{id:input.id}});
   if(!target)throw new AccessError('Usuario no encontrado.',404);
   if(actor.id===target.id&&(input.role!=='ADMIN'||input.status!=='ACTIVE'))throw new AccessError('No puedes retirar tu propio acceso de administrador.',409);
   if(target.role==='ADMIN'&&(input.role!=='ADMIN'||input.status!=='ACTIVE')&&await tx.appUser.count({where:{role:'ADMIN',status:'ACTIVE'}})<=1)throw new AccessError('Debe existir al menos un administrador activo.',409);
   await tx.appUser.update({where:{id:input.id},data:{role:input.role,status:input.status}});
  }else if(input.action==='subscription'){
   const end=new Date(input.currentPeriodEnd+'T23:59:59Z');if(Number.isNaN(end.getTime())||end.toISOString().slice(0,10)!==input.currentPeriodEnd)throw new AccessError('Fecha no válida.',400);
   const chosen=plans[input.plan];const data={plan:input.plan,status:input.status,currentPeriodEnd:end,monthlyPrice:chosen.monthlyPrice,propertyLimit:chosen.propertyLimit};
   await tx.subscription.upsert({where:{workspaceId:input.workspaceId},create:{workspaceId:input.workspaceId,...data},update:data});
  }else if(input.action==='membership'){
   await tx.membership.upsert({where:{userId_workspaceId:{userId:input.userId,workspaceId:input.workspaceId}},create:{userId:input.userId,workspaceId:input.workspaceId},update:{}});
  }else await tx.workspace.update({where:{id:input.id},data:{status:input.status}});
 },{timeout:20000});return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof AccessError?error.message:'No pudimos aplicar el cambio.'},{status:error instanceof AccessError?error.status:503});}
}
