import 'server-only';
import { z } from 'zod';
import { db } from './db';
import { AccessError } from './errors';
import { chileToday } from './ledger';
import type { Prisma } from '@prisma/client';
const id=z.string().min(1).max(100), text=z.string().trim().min(1).max(200), money=z.number().int().positive().max(999999999);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
export const operation=z.discriminatedUnion('action',[
 z.object({action:z.literal('property'),name:text,address:text,owner:text,rent:money,type:z.enum(['Departamento','Casa','Oficina','Local comercial'])}),
 z.object({action:z.literal('contact'),name:text,email:z.union([z.email(),z.literal('')]),kind:z.enum(['OWNER','TENANT'])}),
 z.object({action:z.literal('contract'),propertyId:id,ownerId:id,tenantId:id,startDate:date,endDate:date,rent:money,paymentDay:z.number().int().min(1).max(31).default(5)}),
 z.object({action:z.literal('charge'),contractId:id,period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),dueDate:date,amount:money}),
 z.object({action:z.literal('payment'),chargeId:id,amount:money,paidAt:date,reference:text,idempotencyKey:z.uuid()}),
 z.object({action:z.literal('paymentDay'),contractId:id,paymentDay:z.number().int().min(1).max(31)}),
]);
export async function operate(workspaceId:string, input:z.infer<typeof operation>){
 return db.$transaction(tx=>runOperation(tx,workspaceId,input),{timeout:20000});
}
export async function runOperation(tx:Prisma.TransactionClient,workspaceId:string,input:z.infer<typeof operation>){
  await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
  if(input.action==='property'){
   const sub=await tx.subscription.findUnique({where:{workspaceId}});
   if(sub&&await tx.property.count({where:{workspaceId}})>=sub.propertyLimit)throw new AccessError('Alcanzaste el límite de propiedades de este plan.',409);
   const {action,...data}=input;void action;
   return tx.property.create({data:{...data,workspaceId}});
  }
  if(input.action==='contact'){const {action,email,...data}=input;void action;return tx.contact.create({data:{...data,email:email||null,workspaceId}});}
  if(input.action==='contract'){
   if(input.startDate>=input.endDate)throw new AccessError('El término debe ser posterior al inicio.',400);
   const property=await tx.property.findFirst({where:{id:input.propertyId,workspaceId}});
   const owner=await tx.contact.findFirst({where:{id:input.ownerId,workspaceId,kind:'OWNER'}});
   const tenant=await tx.contact.findFirst({where:{id:input.tenantId,workspaceId,kind:'TENANT'}});
   if(!property||!owner||!tenant)throw new AccessError('Selecciona registros de esta inmobiliaria.',400);
   const startDate=new Date(input.startDate+'T12:00:00Z'),endDate=new Date(input.endDate+'T12:00:00Z');
   if(await tx.contract.findFirst({where:{propertyId:property.id,workspaceId,status:'ACTIVE',startDate:{lte:endDate},endDate:{gte:startDate}}}))throw new AccessError('La propiedad ya tiene un contrato durante ese período.',409);
   await tx.property.update({where:{id:property.id},data:{owner:owner.name,tenant:tenant.name,status:'Arrendada',rent:input.rent}});
   return tx.contract.create({data:{workspaceId,propertyId:property.id,ownerId:owner.id,tenantId:tenant.id,startDate,endDate,rent:input.rent,paymentDay:input.paymentDay}});
  }
  if(input.action==='charge'){
   if(!input.dueDate.startsWith(input.period))throw new AccessError('El vencimiento debe corresponder al mes del cargo.',400);
   const contract=await tx.contract.findFirst({where:{id:input.contractId,workspaceId,status:'ACTIVE'}});
   if(!contract)throw new AccessError('Contrato no disponible.',404);
   const dueDate=new Date(input.dueDate+'T12:00:00Z');
   if(dueDate<contract.startDate||dueDate>contract.endDate)throw new AccessError('El vencimiento debe quedar dentro del contrato.',400);
   if(await tx.charge.findUnique({where:{contractId_period:{contractId:contract.id,period:input.period}}}))throw new AccessError('Este contrato ya tiene un cargo en ese mes.',409);
   return tx.charge.create({data:{workspaceId,contractId:contract.id,period:input.period,dueDate,amount:input.amount}});
  }
  if(input.action==='paymentDay'){
   const updated=await tx.contract.updateMany({where:{id:input.contractId,workspaceId},data:{paymentDay:input.paymentDay}});
   if(!updated.count)throw new AccessError('Contrato no disponible.',404);
   return tx.contract.findUniqueOrThrow({where:{id:input.contractId}});
  }
  const charge=await tx.charge.findFirst({where:{id:input.chargeId,workspaceId},include:{payments:true}});
  if(!charge)throw new AccessError('Cargo no disponible.',404);
  const previous=await tx.payment.findUnique({where:{idempotencyKey:input.idempotencyKey}});
  if(previous){if(previous.workspaceId===workspaceId&&previous.chargeId===charge.id&&previous.amount.toNumber()===input.amount&&previous.reference===input.reference&&previous.paidAt.toISOString().slice(0,10)===input.paidAt)return previous;throw new AccessError('Identificador de pago ya utilizado.',409);}
  const balance=charge.amount.toNumber()-charge.payments.reduce((s,p)=>s+p.amount.toNumber(),0);
  if(input.amount>balance)throw new AccessError('El pago supera el saldo pendiente.',409);
  if(input.paidAt>chileToday())throw new AccessError('El pago no puede tener una fecha futura.',400);
  return tx.payment.create({data:{workspaceId,chargeId:charge.id,amount:input.amount,paidAt:new Date(input.paidAt+'T12:00:00Z'),reference:input.reference,idempotencyKey:input.idempotencyKey}});
}
