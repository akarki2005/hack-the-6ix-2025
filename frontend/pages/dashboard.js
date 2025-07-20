import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSubmissions } from '../src/utils/submissions';
import Head from 'next/head';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Dashboard() {
  const { user, isLoading } = useUser();

  const [assessments, setAssessments] = useState([]);
  const [expandedAssessments, setExpandedAssessments] = useState(new Set());

  useEffect(() => {
    async function initializeUser(user) {
      // First, try to create/login the user to ensure they exist in the database
      try {
        console.log("Initializing user:", user.sub, user.name, user.email);
        const loginRes = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth0Id: user.sub,
            name: user.name,
            email: user.email
          })
        });
        const loginData = await loginRes.json();
        console.log("User initialization result:", loginData);
      } catch (error) {
        console.error("Error initializing user:", error);
      }

      // Then fetch assessments
      await fetchAssessments(user.sub);
    }

    async function fetchAssessments(auth0Id) {
      try {
        console.log("Fetching assessments for auth0Id:", auth0Id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/assessments?auth0Id=${encodeURIComponent(auth0Id)}`);
        console.log("Response status:", res.status);

        if (!res.ok) {
          console.error("Failed to fetch assessments:", res.status, res.statusText);
          return;
        }

        const data = await res.json();
        console.log("Received data:", data);
        console.log("Setting assessments:", data.assessments);
        setAssessments(data.assessments || []);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      }
    }

    if (user && user.sub) {
      initializeUser(user);
    }
  }, [user]);

  const toggleExpanded = (id) => {
    setExpandedAssessments((prev) => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return set;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'processing':
        return 'badge-processing';
      case 'pending':
        return 'badge-pending';
      default:
        return 'badge-error';
    }
  };

  const formatDate = (str) => new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      <Head>
        <title>Dashboard - SkillBranch</title>
        <meta name="description" content="Manage your code assessments and view candidate results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* Navbar */}
        <nav className="relative z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src="/favicon.ico" alt="SkillBranch" className="w-8 h-8 brightness-0 invert" />
                <span className="text-white font-bold text-xl">SkillBranch</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-slate-300 text-sm">
                  {user?.name || user?.email}
                </span>
                <a
                  href="/api/auth/logout"
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-slate-800/50"
                >
                  Sign Out
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Assessment Dashboard
            </h1>
            <p className="text-lg text-slate-400">
              Manage your code assessments and track candidate performance
            </p>
          </div>

          {/* Assessments Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Your Assessments</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Track and manage all your repository-based assessments
                  </p>
                </div>
                <Link 
                  href="/submit" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Assessment
                </Link>
              </div>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No assessments yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Create your first assessment to start evaluating candidates with real code challenges
                </p>
                <Link 
                  href="/submit" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Assessment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {assessments.map((a, idx) => {
                  const expanded = expandedAssessments.has(a._id || idx);
                  return (
                    <div key={a._id || idx} className="hover:bg-slate-800/30 transition-all duration-200">
                      <div className="px-8 py-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-base font-medium text-white">
                                  Assessment #{(a._id || idx).toString().slice(-8)}
                                </p>
                                <div className="mt-2 space-y-1">
                                  {a.repoOwner && a.repoName && (
                                    <p className="text-sm text-slate-400">
                                      Repository: <span className="text-blue-400">{a.repoOwner}/{a.repoName}</span>
                                    </p>
                                  )}
                                  {a.createdAt && (
                                    <p className="text-sm text-slate-400">
                                      Created: {formatDate(a.createdAt)}
                                    </p>
                                  )}
                                  {a.candidates && a.candidates.length > 0 && (
                                    <p className="text-sm text-slate-400">
                                      Candidates: {a.candidates.length}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => toggleExpanded(a._id || idx)} 
                                className="ml-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                              >
                                <svg 
                                  className={`h-5 w-5 transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-8 pb-6 bg-slate-900/50 border-t border-slate-700/50">
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-white mb-3">Assessment Details</h4>
                            <pre className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/50 text-xs text-slate-300 overflow-x-auto font-mono">
                              {JSON.stringify(a, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
