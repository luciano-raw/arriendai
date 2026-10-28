import { NextResponse } from 'next/server';
import { AccessError, checkOrigin } from '../../../lib/access';
import { getWorkspace } from '../../../lib/workspace';
import { operation, operate } from '../../../lib/operations';
export async function POST(request:Request){
 try{checkOrigin(request);const workspace=await getWorkspace(new URL(request.url).searchParams.get('workspace')||undefined);const parsed=operation.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Vuelve a revisar los campos del formulario.'},{status:400});await operate(workspace.id,parsed.data);return NextResponse.json({ok:true});}
 catch(error){return NextResponse.json({error:error instanceof AccessError?error.message:'No pudimos guardar el registro.'},{status:error instanceof AccessError?error.status:503});}
}
