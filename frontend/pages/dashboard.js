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
        const res = await fetch(`http://localhost:5000/api/user/assessments?auth0Id=${encodeURIComponent(auth0Id)}`);
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
        <title>Hackthe6ix - Dashboard</title>
        <meta name="description" content="Repository submissions dashboard" />
      </Head>

      <div className="min-h-screen bg-[var(--bg)]">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-4 relative">
              <h1 className="text-3xl font-bold text-black">Hackthe6ix</h1>
              {/* Logout button - top right */}
              {!isLoading && user && (
                <a
                  href="/api/auth/logout"
                  className="btn-secondary inline-block absolute right-0 top-1/2 -translate-y-1/2"
                  style={{
                    padding: '8px 16px',
                    background: '#eb5757',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Log Out
                </a>
              )}
            </div>
          </div>
        </nav>

        {/* Dashboard Title */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <h2 className="text-2xl font-bold text-black">Dashboard</h2>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats hidden */}
          {/* Assessments Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-black">Assessments</h3>
                  <p className="text-sm text-gray-500 mt-1">A list of all your repository assessments and their current status.</p>
                </div>
                <Link href="/submit" className="btn-primary inline-flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Assessment
                </Link>
              </div>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-black mb-2">No assessments</h3>
                <p className="text-gray-500 mb-6">Get started by creating a new assessment.</p>
                <Link href="/submit" className="btn-primary inline-flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Assessment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {assessments.map((a, idx) => {
                  const expanded = expandedAssessments.has(a._id || idx);
                  return (
                    <div key={a._id || idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-black truncate">Assessment ID: {a._id || idx}</p>
                                {/* Add more assessment details here if needed */}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {a.createdAt ? formatDate(a.createdAt) : ''}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => toggleExpanded(a._id || idx)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors duration-200">
                            <svg className={`h-5 w-5 transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-6 pb-4 bg-gray-50 border-t border-gray-200">
                          <div className="mt-4 space-y-4">
                            <pre className="bg-white p-3 rounded-md border border-gray-200 text-xs text-black overflow-x-auto">{JSON.stringify(a, null, 2)}</pre>
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