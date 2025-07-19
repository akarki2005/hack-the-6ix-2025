import Head from 'next/head';

export default function Landing() {
  return (
    <>
      <Head>
        <title>Hackthe6ix</title>
        <meta name="description" content="Hackthe6ix assessment platform" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-center px-4">
        <h1 className="text-5xl font-extrabold text-[var(--primary)] mb-10">Hackthe6ix</h1>
        <div className="space-x-4">
          <a href="/api/auth/login?screen_hint=signup" className="btn-primary inline-block">Sign Up</a>
          <a href="/api/auth/login" className="btn-secondary inline-block">Log In</a>
        </div>
      </div>
    </>
  );
} 