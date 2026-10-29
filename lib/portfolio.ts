import 'server-only';
import { db } from './db';
import { chileToday, chargeBalance, chargeState } from './ledger';

export async function portfolio(workspaceId: string) {
  const data = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, include: { subscription: true, properties: { orderBy: { createdAt: 'desc' } }, contacts: { orderBy: { name: 'asc' } }, contracts: { include: { property: true, owner: true, tenant: true } }, charges: { include: { payments: true, contract: { include: { property: true, tenant: true } } }, orderBy: { dueDate: 'desc' } }, payments: { orderBy: { paidAt: 'desc' }, include: { charge: { include: { contract: { include: { property: true } } } } } } } });
  const today = chileToday();
  const month = today.slice(0, 7);
  const charges = data.charges.map(c => { const item = { id: c.id, amount: c.amount.toNumber(), dueDate: c.dueDate.toISOString(), payments: c.payments.map(p=>({amount:p.amount.toNumber()})) }; return { ...item, period: c.period, property: c.contract.property.name, tenant: c.contract.tenant.name, balance: chargeBalance(item), status: chargeState(item,today) }; });
  const months = Array.from({length:6},(_,i)=> { const date = new Date(`${month}-15T12:00:00Z`); date.setUTCMonth(date.getUTCMonth()-5+i); const key=date.toISOString().slice(0,7); return {month:key,label:new Intl.DateTimeFormat('es-CL',{month:'short',timeZone:'UTC'}).format(date),amount:data.payments.filter(p=>chileToday(p.paidAt).startsWith(key)).reduce((sum,p)=>sum+p.amount.toNumber(),0)}; });
  return { id:data.id, name:data.name, demo:data.demo, today, subscription: data.subscription?{plan:data.subscription.plan,status:data.subscription.status,limit:data.subscription.propertyLimit}:null,
    properties:data.properties.map(p=>({id:p.id,name:p.name,address:p.address,owner:p.owner,tenant:p.tenant,rent:p.rent.toNumber(),type:p.type,status:data.contracts.some(c=>c.propertyId===p.id&&c.status==='ACTIVE'&&c.startDate.toISOString().slice(0,10)<=today&&c.endDate.toISOString().slice(0,10)>=today)?'Arrendada':p.status==='Arrendada'?'Disponible':p.status})),
    contacts:data.contacts.map(c=>({id:c.id,name:c.name,email:c.email,kind:c.kind})),
    contracts:data.contracts.map(c=>({id:c.id,property:c.property.name,owner:c.owner.name,ownerId:c.ownerId,tenant:c.tenant.name,tenantId:c.tenantId,startDate:c.startDate.toISOString().slice(0,10),endDate:c.endDate.toISOString().slice(0,10),rent:c.rent.toNumber(),paymentDay:c.paymentDay,status:c.status==='ACTIVE'?c.endDate.toISOString().slice(0,10)<today?'Finalizado':c.startDate.toISOString().slice(0,10)>today?'Próximo':'Vigente':'Finalizado'})),
    charges, payments:data.payments.map(p=>({id:p.id,property:p.charge.contract.property.name,amount:p.amount.toNumber(),paidAt:p.paidAt.toISOString(),reference:p.reference})), months,
    stats:{collected:data.payments.filter(p=>chileToday(p.paidAt).startsWith(month)).reduce((sum,p)=>sum+p.amount.toNumber(),0),pending:charges.reduce((s,c)=>s+c.balance,0),overdue:charges.filter(c=>c.status==='Vencido').reduce((s,c)=>s+c.balance,0),occupied:data.contracts.filter(c=>c.status==='ACTIVE'&&c.startDate.toISOString().slice(0,10)<=today&&c.endDate.toISOString().slice(0,10)>=today).map(c=>c.propertyId).filter((v,i,a)=>a.indexOf(v)===i).length} };
}
export type Portfolio = Awaited<ReturnType<typeof portfolio>>;
