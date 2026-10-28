import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chargeBalance, chargeState, chileToday } from '../lib/ledger.ts';
import { subscriptionUsable } from '../lib/plans.ts';
test('el saldo descuenta pagos parciales y la mora cuenta solo el pendiente',()=>{const charge={id:'1',amount:540000,dueDate:'2026-10-05T12:00:00Z',payments:[{amount:200000}]};assert.equal(chargeBalance(charge),340000);assert.equal(chargeState(charge,'2026-10-28'),'Vencido');});
test('un pago completo no sigue vencido y la fecha de vencimiento aún no es mora',()=>{const charge={id:'1',amount:100,dueDate:'2026-10-28T12:00:00Z',payments:[]};assert.equal(chargeState(charge,'2026-10-28'),'Pendiente');assert.equal(chargeState({...charge,payments:[{amount:100}]},'2026-10-30'),'Pagado');assert.equal(chargeState({...charge,payments:[{amount:40}]},'2026-10-27'),'Abonado');});
test('la fecha operativa respeta Santiago al cruzar medianoche UTC',()=>{assert.equal(chileToday(new Date('2026-10-28T01:30:00Z')),'2026-10-27');});
test('la vigencia de una suscripción incluye el último día y respeta su estado',()=>{assert.equal(subscriptionUsable('ACTIVE','2026-10-28','2026-10-28'),true);assert.equal(subscriptionUsable('TRIAL','2026-10-27','2026-10-28'),false);assert.equal(subscriptionUsable('CANCELED','2026-12-01','2026-10-28'),false);assert.equal(subscriptionUsable('PAST_DUE',null,'2026-10-28'),false);});
