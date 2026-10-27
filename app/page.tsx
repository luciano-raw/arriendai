import Dashboard from '../components/dashboard';
export default function Home() { return <Dashboard authConfigured={!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY} />; }
