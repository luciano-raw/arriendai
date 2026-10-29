import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWorkspace } from '../../../lib/workspace';
import { AccessError, checkOrigin } from '../../../lib/access';
import { db } from '../../../lib/db';
import { validPeriod } from '../../../lib/charge-plan';
import { monthlyPreview, generateMonthlyCharges } from '../../../lib/monthly-charges';
const periodSchema=z.string().refine(validPeriod);
export async function GET(request:Request){
 try{const query=new URL(request.url).searchParams;const workspace=await getWorkspace(query.get('workspace')||undefined);const period=periodSchema.safeParse(query.get('period'));if(!period.success)return NextResponse.json({error:'Selecciona un mes válido (2000–2199).'},{status:400});const rows=await db.$transaction(tx=>monthlyPreview(tx,workspace.id,period.data),{isolationLevel:'RepeatableRead',timeout:20000});return NextResponse.json({period:period.data,rows},{headers:{'Cache-Control':'private, no-store'}});}
 catch(error){return NextResponse.json({error:error instanceof AccessError?error.message:'No se pudo preparar la vista previa.'},{status:error instanceof AccessError?error.status:503});}
}
export async function POST(request:Request){
 try{checkOrigin(request);const workspace=await getWorkspace(new URL(request.url).searchParams.get('workspace')||undefined);const input=z.object({period:periodSchema}).safeParse(await request.json());if(!input.success)return NextResponse.json({error:'Selecciona un mes válido (2000–2199).'},{status:400});const result=await db.$transaction(tx=>generateMonthlyCharges(tx,workspace.id,input.data.period),{timeout:20000});return NextResponse.json({ok:true,...result});}
 catch(error){return NextResponse.json({error:error instanceof AccessError?error.message:'No se pudieron generar los cargos.'},{status:error instanceof AccessError?error.status:503});}
}
