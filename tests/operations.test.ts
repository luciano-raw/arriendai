import { config } from 'dotenv';
import { test } from 'node:test';
import assert from 'node:assert/strict';
config({path:'.env.local',quiet:true});

test('operaciones reales: aislamiento, límites, superposición, abonos e idempotencia',async()=>{
 const { db }=await import('../lib/db');
 const { runOperation, operation }=await import('../lib/operations');
 const { syncIdentity }=await import('../lib/identity');
 const rollback=new Error('rollback');
 try{await db.$transaction(async tx=>{
  const a=await tx.workspace.create({data:{name:'Prueba temporal A',subscription:{create:{propertyLimit:1}}}});
  const b=await tx.workspace.create({data:{name:'Prueba temporal B'}});
  const property=await runOperation(tx,a.id,operation.parse({action:'property',name:'Prueba',address:'Dirección de prueba',owner:'Propietario',rent:100000,type:'Casa'}));
  assert.ok(property);
  await assert.rejects(()=>runOperation(tx,a.id,operation.parse({action:'property',name:'Otra',address:'Prueba',owner:'Propietario',rent:100000,type:'Casa'})),/límite/);
  const owner=await tx.contact.create({data:{workspaceId:a.id,name:'Propietario',kind:'OWNER'}});
  const tenant=await tx.contact.create({data:{workspaceId:a.id,name:'Arrendatario',kind:'TENANT'}});
  const contractInput={action:'contract',propertyId:property.id,ownerId:owner.id,tenantId:tenant.id,startDate:'2026-01-01',endDate:'2027-12-31',rent:100000};
  const contract=await runOperation(tx,a.id,operation.parse(contractInput));
  await assert.rejects(()=>runOperation(tx,a.id,operation.parse(contractInput)),/contrato/);
  await assert.rejects(()=>runOperation(tx,b.id,operation.parse(contractInput)),/esta inmobiliaria/);
  const charge=await runOperation(tx,a.id,operation.parse({action:'charge',contractId:contract.id,period:'2026-01',dueDate:'2026-01-05',amount:100000}));
  await assert.rejects(()=>runOperation(tx,b.id,operation.parse({action:'charge',contractId:contract.id,period:'2026-02',dueDate:'2026-02-05',amount:100000})),/no disponible/);
  const payment={action:'payment',chargeId:charge.id,amount:40000,paidAt:'2026-01-04',reference:'TEST',idempotencyKey:crypto.randomUUID()};
  await runOperation(tx,a.id,operation.parse(payment));
  await runOperation(tx,a.id,operation.parse(payment));
  assert.equal(await tx.payment.count({where:{chargeId:charge.id}}),1);
  await assert.rejects(()=>runOperation(tx,a.id,operation.parse({...payment,amount:70000,idempotencyKey:crypto.randomUUID()})),/supera/);
  await assert.rejects(()=>runOperation(tx,b.id,operation.parse({...payment,idempotencyKey:crypto.randomUUID()})),/no disponible/);
  await runOperation(tx,a.id,operation.parse({...payment,amount:60000,idempotencyKey:crypto.randomUUID()}));
  const paid=await tx.payment.aggregate({where:{chargeId:charge.id},_sum:{amount:true}});assert.equal(paid._sum.amount?.toNumber(),100000);
  const unique=crypto.randomUUID();const identity={clerkUserId:'test_'+unique,email:unique+'@example.com',name:'Administrador de prueba',verified:true};
  await tx.adminGrant.create({data:{email:identity.email,workspaceId:a.id}});
  await assert.rejects(()=>syncIdentity(tx,{...identity,verified:false}),/Verifica/);
  assert.equal((await tx.adminGrant.findUnique({where:{email:identity.email}}))?.consumedBy,null);
  const admin=await syncIdentity(tx,identity);assert.equal(admin.role,'ADMIN');
  assert.equal(await tx.membership.count({where:{userId:admin.id,workspaceId:a.id}}),1);
  await tx.appUser.update({where:{id:admin.id},data:{role:'USER'}});
  assert.equal((await syncIdentity(tx,identity)).role,'USER','La reserva se consume una sola vez y no revierte cambios de rol posteriores');
  const ordinary=await syncIdentity(tx,{...identity,clerkUserId:'other_'+unique,email:'other_'+unique+'@example.com'});assert.equal(ordinary.role,'USER');
  throw rollback;
 },{timeout:60000});}catch(error){if(error!==rollback)throw error;}finally{await db.$disconnect();}
});
