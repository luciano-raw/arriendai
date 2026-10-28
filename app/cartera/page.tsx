import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { account, AccessError } from '../../lib/access';
import { getWorkspace } from '../../lib/workspace';
import { portfolio } from '../../lib/portfolio';
import { db } from '../../lib/db';
import PortfolioView from '../../components/portfolio-view';
export const dynamic = 'force-dynamic';
export default async function PortfolioPage({searchParams}:{searchParams:Promise<{workspace?:string}>}){
 const {userId}=await auth();if(!userId)redirect('/sign-in');
 try{
  const user=await account();const selected=(await searchParams).workspace;
  const workspace=await getWorkspace(selected);const data=await portfolio(workspace.id);
  const workspaces=await db.workspace.findMany({where:user.role==='ADMIN'?{}:{members:{some:{userId:user.id}}},select:{id:true,name:true},orderBy:{name:'asc'}});
  return <PortfolioView data={data} user={{name:user.name,role:user.role}} workspaces={workspaces}/>;
 }catch(error){if(error instanceof AccessError)return <main className="auth-page"><h1>Acceso a tu inmobiliaria</h1><p>{error.message}</p><a className="primary" href="/sign-in">Volver al acceso</a></main>;throw error;}
}
