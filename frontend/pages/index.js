import Head from 'next/head';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';

export default function Landing() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to dashboard when logged in
  if (!isLoading && user) {
    router.replace('/dashboard');
  }

  return (
    <>
      <Head>
        <title>Hackthe6ix</title>
        <meta name="description" content="Hackthe6ix assessment platform" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-center px-4">
        <h1 className="text-5xl font-extrabold text-[var(--primary)] mb-10">Hackthe6ix</h1>
        {!isLoading && (
          <div className="space-x-4">
            {user ? (
              <a href="/api/auth/logout" className="btn-secondary inline-block">Log Out</a>
            ) : (
              <>
                <a href="/api/auth/login?screen_hint=signup&returnTo=/dashboard" className="btn-primary inline-block">Sign Up</a>
                <a href="/api/auth/login?returnTo=/dashboard" className="btn-secondary inline-block">Log In</a>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
} 