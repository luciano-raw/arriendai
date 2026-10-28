import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { administrator, AccessError } from '../../lib/access';
import { db } from '../../lib/db';
import AdminView from '../../components/admin-view';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const {userId}=await auth();if(!userId)redirect('/sign-in');
 try{const actor=await administrator();const users=await db.appUser.findMany({include:{memberships:{include:{workspace:true}}},orderBy:{createdAt:'desc'}});const workspaces=await db.workspace.findMany({include:{subscription:true,_count:{select:{properties:true,members:true}}},orderBy:{createdAt:'desc'}});const grants=await db.adminGrant.findMany({where:{consumedBy:null},select:{email:true}});
 return <AdminView user={{name:actor.name,role:actor.role}} users={users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,status:u.status,memberships:u.memberships.map(m=>m.workspace.name)}))} workspaces={workspaces.map(w=>({id:w.id,name:w.name,status:w.status,demo:w.demo,properties:w._count.properties,members:w._count.members,subscription:w.subscription?{plan:w.subscription.plan,status:w.subscription.status,monthlyPrice:w.subscription.monthlyPrice.toNumber(),limit:w.subscription.propertyLimit,end:w.subscription.currentPeriodEnd?.toISOString().slice(0,10)||''}:null}))} pending={grants.map(g=>g.email)}/>;
 }catch(error){if(error instanceof AccessError)return <main className="auth-page"><h1>Administración de plataforma</h1><p>{error.message}</p><a className="primary" href="/cartera">Ir a mi inmobiliaria</a></main>;throw error;}
}
