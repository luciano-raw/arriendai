import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Dashboard from '../../components/dashboard';
export const dynamic = 'force-dynamic';
export default async function Portfolio() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) redirect('/sign-in');
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <Dashboard live authConfigured />;
}
