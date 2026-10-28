import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
config({path:'.env.local',quiet:true});
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1})});
const email='luciano.raw04@gmail.com';
const workspaceId='demo_vertice_luciano';
const prefix='demo_vertice_';
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const month=today.slice(0,7);
const base=new Date(month+'-15T12:00:00Z');
const start=new Date(base);start.setUTCMonth(start.getUTCMonth()-5);start.setUTCDate(1);
const end=new Date(base);end.setUTCFullYear(end.getUTCFullYear()+1);end.setUTCDate(28);
try{
 await db.$transaction(async tx=>{
  await tx.workspace.upsert({where:{id:workspaceId},create:{id:workspaceId,name:'Vértice Inmobiliaria · Demostración',demo:true},update:{}});
  const grant=await tx.adminGrant.upsert({where:{email},create:{email,workspaceId},update:{}});
  const user=await tx.appUser.findUnique({where:{email}});
  if(user&&!grant.consumedBy){await tx.appUser.update({where:{id:user.id},data:{role:'ADMIN',status:'ACTIVE'}});await tx.membership.upsert({where:{userId_workspaceId:{userId:user.id,workspaceId}},create:{userId:user.id,workspaceId},update:{}});await tx.adminGrant.update({where:{email},data:{consumedBy:user.clerkUserId}});}
  await tx.subscription.upsert({where:{workspaceId},create:{workspaceId,plan:'PRO',status:'ACTIVE',monthlyPrice:59990,propertyLimit:100,currentPeriodEnd:end},update:{}});
  const owners=['María José González','Carlos Muñoz','Andrea Silva','Inversiones del Sur SpA','Roberto Fuentes'];
  const tenants=['Felipe Rodríguez','Camila Pérez','Estudio Norte SpA'];
  for(let i=0;i<owners.length;i++)await tx.contact.upsert({where:{id:prefix+'owner_'+i},create:{id:prefix+'owner_'+i,workspaceId,name:owners[i],kind:'OWNER',email:`propietario${i+1}@example.com`},update:{}});
  for(let i=0;i<tenants.length;i++)await tx.contact.upsert({where:{id:prefix+'tenant_'+i},create:{id:prefix+'tenant_'+i,workspaceId,name:tenants[i],kind:'TENANT',email:`arrendatario${i+1}@example.com`},update:{}});
  const properties=[
   {name:'Departamento Los Olivos',address:'Av. Las Condes 12450, Las Condes',rent:780000,type:'Departamento',status:'Arrendada',owner:owners[0],tenant:tenants[0]},
   {name:'Casa Parque del Sol',address:'Los Castaños 845, La Florida',rent:950000,type:'Casa',status:'Arrendada',owner:owners[1],tenant:tenants[1]},
   {name:'Oficina Nueva Providencia',address:'Nueva Providencia 1860, Providencia',rent:540000,type:'Oficina',status:'Arrendada',owner:owners[3],tenant:tenants[2]},
   {name:'Departamento Vista Cordillera',address:'Av. Irarrázaval 3200, Ñuñoa',rent:620000,type:'Departamento',status:'Disponible',owner:owners[2],tenant:'Sin arrendatario'},
   {name:'Casa Jardines de La Reina',address:'Príncipe de Gales 7260, La Reina',rent:1250000,type:'Casa',status:'Mantención',owner:owners[4],tenant:'Sin arrendatario'},
  ];
  for(let i=0;i<properties.length;i++)await tx.property.upsert({where:{id:prefix+'property_'+i},create:{id:prefix+'property_'+i,workspaceId,...properties[i]},update:{}});
  for(let i=0;i<3;i++){
   const contractId=prefix+'contract_'+i;
   await tx.contract.upsert({where:{id:contractId},create:{id:contractId,workspaceId,propertyId:prefix+'property_'+i,ownerId:prefix+'owner_'+(i===2?3:i),tenantId:prefix+'tenant_'+i,startDate:start,endDate:end,rent:properties[i].rent},update:{}});
   for(let offset=5;offset>=0;offset--){
    const date=new Date(base);date.setUTCMonth(date.getUTCMonth()-offset);const period=date.toISOString().slice(0,7);const chargeId=prefix+`charge_${i}_${period}`;
    const charge=await tx.charge.upsert({where:{contractId_period:{contractId,period}},create:{id:chargeId,workspaceId,contractId,period,dueDate:new Date(period+'-05T12:00:00Z'),amount:properties[i].rent},update:{}});
    const key=prefix+`payment_${i}_${period}`;
    const amount=offset===0&&i===2?200000:properties[i].rent;
    // Idempotent: only add the original seed payment to a newly seeded charge.
    if(!await tx.payment.findUnique({where:{idempotencyKey:key}})){
     const paid=await tx.payment.aggregate({where:{chargeId:charge.id},_sum:{amount:true}});const remaining=charge.amount.toNumber()-(paid._sum.amount?.toNumber()||0);
     if(remaining>=amount)await tx.payment.create({data:{workspaceId,chargeId:charge.id,amount,paidAt:new Date(period+(offset===0?`-${today.slice(8)}T12:00:00Z`:'-04T12:00:00Z')),reference:`DEMO-${period}-${i+1}`,idempotencyKey:key}});
    }
   }
  }
 },{timeout:60000});
 console.log('Demostración guardada para el correo confirmado. Alta de administrador pendiente del primer acceso verificado si la cuenta todavía no existe.');
 console.log(JSON.stringify({properties:await db.property.count({where:{workspaceId}}),contacts:await db.contact.count({where:{workspaceId}}),contracts:await db.contract.count({where:{workspaceId}}),charges:await db.charge.count({where:{workspaceId}}),payments:await db.payment.count({where:{workspaceId}})}));
}catch(error){console.error('Error en carga inicial:',error instanceof Error?error.message:'Error');process.exitCode=1;}finally{await db.$disconnect();}
