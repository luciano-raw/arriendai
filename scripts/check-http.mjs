import assert from 'node:assert/strict';
const base = process.env.APP_URL || 'http://localhost:3000';
for (const path of ['/sign-in']) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, `${path} debe estar disponible`);
  console.log(`OK ${path}: ${response.status}`);
  await response.body?.cancel();
}
const root = await fetch(new URL('/', base), { redirect: 'manual', signal: AbortSignal.timeout(60000) });
assert.equal(root.status, 307, 'El inicio debe dirigir a la cartera autenticada');
await root.body?.cancel();
const privatePage = await fetch(new URL('/cartera', base), { redirect: 'manual', signal: AbortSignal.timeout(60000) });
assert.ok([302, 307, 503].includes(privatePage.status), 'La cartera no puede estar disponible sin sesión');
console.log(`OK /cartera sin sesión: ${privatePage.status}`);
await privatePage.body?.cancel();
for (const method of ['GET', 'POST']) {
  const response = await fetch(new URL('/api/properties', base), { method, headers: { Origin: base }, redirect: 'manual', signal: AbortSignal.timeout(60000) });
  assert.ok([401, 503].includes(response.status), `La API debe rechazar solicitudes sin sesión: recibido ${response.status}`);
  console.log(`OK ${method} /api/properties sin sesión: ${response.status}${response.status===503?' (claves Clerk pendientes)':''}`);
  await response.body?.cancel();
}
const crossOrigin = await fetch(new URL('/api/properties', base), { method: 'POST', headers: { Origin: 'https://example.invalid' }, redirect: 'manual', signal: AbortSignal.timeout(60000) });
assert.equal(crossOrigin.status, 403, 'El formulario debe rechazar orígenes ajenos');
await crossOrigin.body?.cancel();
console.log('OK POST de origen ajeno: 403');
for(const method of ['GET','POST']){
 const response=await fetch(new URL('/api/charges?period=2026-11',base),{method,headers:{Origin:base,'Content-Type':'application/json'},body:method==='POST'?JSON.stringify({period:'2026-11'}):undefined,redirect:'manual',signal:AbortSignal.timeout(60000)});
 assert.equal(response.status,401,`La generación mensual debe exigir sesión (${method})`);await response.body?.cancel();console.log(`OK ${method} /api/charges sin sesión: 401`);
}
for (const path of ['/admin', '/api/admin', '/api/portfolio']) {
 const response=await fetch(new URL(path,base),{method:path==='/admin'?'GET':'POST',headers:{Origin:base,'Content-Type':'application/json'},body:path==='/admin'?undefined:JSON.stringify({action:'workspace'}),redirect:'manual',signal:AbortSignal.timeout(60000)});
 assert.equal(response.status,path==='/admin'?307:401,`${path} debe exigir sesión`);await response.body?.cancel();console.log(`OK ${path} sin sesión: ${response.status}`);
}
