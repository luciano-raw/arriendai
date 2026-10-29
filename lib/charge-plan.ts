export type BillingContract={id:string;property:string;tenant:string;rent:number;paymentDay:number;startDate:string;endDate:string;status:string};
export function validPeriod(period:string){return /^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/.test(period);}
export function billingDate(period:string,paymentDay:number){
 if(!validPeriod(period)||!Number.isInteger(paymentDay)||paymentDay<1||paymentDay>31)throw new Error('Período o día de pago no válido.');
 const [year,month]=period.split('-').map(Number);
 const lastDay=new Date(Date.UTC(year,month,0)).getUTCDate();
 return `${period}-${String(Math.min(paymentDay,lastDay)).padStart(2,'0')}`;
}
export function chargePlan(contracts:BillingContract[],period:string,existing:Map<string,{amount:number;dueDate:string}>){
 if(!validPeriod(period))throw new Error('Período no válido.');
 return contracts.map(contract=>{
  const dueDate=billingDate(period,contract.paymentDay), prior=existing.get(contract.id);
  const base={contractId:contract.id,property:contract.property,tenant:contract.tenant,amount:contract.rent,dueDate};
  // Existing monthly amounts and due dates are authoritative, including manual adjustments.
  if(prior)return {...base,amount:prior.amount,dueDate:prior.dueDate,state:'EXISTS' as const,reason:'Ya existe un cargo para este contrato y mes.'};
  if(contract.status!=='ACTIVE')return {...base,state:'SKIP' as const,reason:'Contrato inactivo.'};
  if(dueDate<contract.startDate.slice(0,10))return {...base,state:'SKIP' as const,reason:contract.startDate.slice(0,7)===period?'Primer mes parcial: registra el cargo manualmente.':'El contrato todavía no inicia.'};
  if(dueDate>contract.endDate.slice(0,10))return {...base,state:'SKIP' as const,reason:contract.endDate.slice(0,7)===period?'Último mes parcial: registra el cargo manualmente.':'El contrato ya terminó.'};
  const first=`${period}-01`,last=billingDate(period,31);
  if(contract.startDate.slice(0,10)>first||contract.endDate.slice(0,10)<last)return {...base,state:'SKIP' as const,reason:'Mes parcial: revisa el monto y registra el cargo manualmente.'};
  return {...base,state:'CREATE' as const,reason:'Arriendo mensual completo, sin prorrateo.'};
 });
}
export type ChargePlan=ReturnType<typeof chargePlan>;
