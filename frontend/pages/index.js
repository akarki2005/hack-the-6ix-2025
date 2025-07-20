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
        <title>SkillBranch - Code Assessment Platform</title>
        <meta name="description" content="Transform your hiring process with real-world code assessments. SkillBranch helps companies evaluate candidates using actual company codebases." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 mb-4 leading-tight">
              SkillBranch
            </h1>
          </div>

          {/* Subtitle */}
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6">
              Technical hiring using 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-semibold"> your production codebase</span>
            </p>
            <p className="text-base text-slate-400 max-w-xl mx-auto">
              Skip the whiteboard. Test candidates on real code challenges from your repository.
            </p>
          </div>

          {/* CTA Buttons */}
          {!isLoading && !user && (
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <a 
                href="/api/auth/login?screen_hint=signup&returnTo=/dashboard"
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-base font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
              >
                <span className="relative z-10">Sign Up</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              
              <a 
                href="/api/auth/login?returnTo=/dashboard"
                className="px-6 py-3 border border-slate-600 text-slate-300 text-base font-medium rounded-lg hover:border-slate-500 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                Log In
              </a>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Production Code</h3>
              <p className="text-sm text-slate-400">Use your existing codebase. No artificial problems or toy examples.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Automated Scoring</h3>
              <p className="text-sm text-slate-400">Code analysis with detailed performance metrics and feedback.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Quick Setup</h3>
              <p className="text-sm text-slate-400">Connect your repository and start assessing candidates immediately.</p>
            </div>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </div>
    </>
  );
} 