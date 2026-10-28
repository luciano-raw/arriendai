export const plans = {
  INICIAL: { name: 'Inicial', monthlyPrice: 29990, propertyLimit: 25 },
  PRO: { name: 'Pro', monthlyPrice: 59990, propertyLimit: 100 },
  EMPRESA: { name: 'Empresa', monthlyPrice: 129990, propertyLimit: 500 },
} as const;
export function subscriptionUsable(status:string,endDate:string|null,today:string){return ['TRIAL','ACTIVE'].includes(status)&&(!endDate||endDate>=today);}
