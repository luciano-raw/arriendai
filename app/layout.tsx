import type { Metadata } from 'next';
import './globals.css';
import './connected.css';
import { ClerkProvider } from '@clerk/nextjs';
export const metadata: Metadata = { title: 'ArriendAI · Gestión inmobiliaria', description: 'Tu cartera inmobiliaria, bajo control.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
 const configured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
 return <html lang="es-CL"><body>{configured ? <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/cartera" signUpFallbackRedirectUrl="/cartera" appearance={{ variables: { colorPrimary: '#007c79', borderRadius: '0.6rem' } }}>{children}</ClerkProvider> : children}</body></html>;
}
