import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';
export default function SignInPage() {
  const configured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
  return <main className="auth-page"><a className="auth-brand" href="/">Arriend<span>AI.</span></a><h1>Tu negocio inmobiliario, en orden.</h1><p>Inicia sesión para administrar tu cartera.</p>{configured ? <Suspense fallback={<p>Cargando acceso…</p>}><SignIn fallbackRedirectUrl="/cartera" signUpUrl="/sign-up" /></Suspense> : <div className="panel info-panel"><h2>Falta completar Clerk</h2><p>Agrega las claves de desarrollo en .env.local y reinicia el servidor para habilitar el acceso.</p><a className="primary" href="/">Explorar demostración</a></div>}</main>;
}
