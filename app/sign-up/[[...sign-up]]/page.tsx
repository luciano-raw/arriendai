import { SignUp } from '@clerk/nextjs';
import { Suspense } from 'react';
export default function SignUpPage() {
  const configured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
  return <main className="auth-page"><a className="auth-brand" href="/">Arriend<span>AI.</span></a><h1>Tu próxima etapa empieza aquí.</h1><p>Crea tu cuenta para organizar tu cartera inmobiliaria.</p>{configured ? <Suspense fallback={<p>Cargando registro…</p>}><SignUp fallbackRedirectUrl="/cartera" signInUrl="/sign-in" /></Suspense> : <a className="primary" href="/sign-in">Ver configuración de acceso</a>}</main>;
}
