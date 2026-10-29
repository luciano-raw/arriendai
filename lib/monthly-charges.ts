import 'server-only';
import type { Prisma } from '@prisma/client';
import { chargePlan } from './charge-plan';

export async function monthlyPreview(tx:Prisma.TransactionClient,workspaceId:string,period:string){
 const contracts=await tx.contract.findMany({where:{workspaceId},include:{property:true,tenant:true},orderBy:{id:'asc'}});
 const existing=await tx.charge.findMany({where:{workspaceId,period}});
 return chargePlan(contracts.map(c=>({id:c.id,property:c.property.name,tenant:c.tenant.name,rent:c.rent.toNumber(),paymentDay:c.paymentDay,startDate:c.startDate.toISOString(),endDate:c.endDate.toISOString(),status:c.status})),period,new Map(existing.map(c=>[c.contractId,{amount:c.amount.toNumber(),dueDate:c.dueDate.toISOString().slice(0,10)}])));
}
export async function generateMonthlyCharges(tx:Prisma.TransactionClient,workspaceId:string,period:string){
 await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
 const rows=await monthlyPreview(tx,workspaceId,period);
 const pending=rows.filter(r=>r.state==='CREATE');
 const result=await tx.charge.createMany({data:pending.map(row=>({workspaceId,contractId:row.contractId,period,amount:row.amount,dueDate:new Date(row.dueDate+'T12:00:00Z')})),skipDuplicates:true});
 return {created:result.count,existing:rows.filter(r=>r.state==='EXISTS').length,skipped:rows.filter(r=>r.state==='SKIP').length,total:pending.reduce((sum,r)=>sum+r.amount,0)};
}
