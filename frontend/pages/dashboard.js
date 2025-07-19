import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSubmissions } from '../src/utils/submissions';
import Head from 'next/head';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());

  useEffect(() => {
    const loadSubmissions = () => {
      const storedSubmissions = getSubmissions();
      setSubmissions(storedSubmissions);
    };
    loadSubmissions();
    const handleSubmissionsUpdate = () => loadSubmissions();
    window.addEventListener('submissionsUpdated', handleSubmissionsUpdate);
    return () => window.removeEventListener('submissionsUpdated', handleSubmissionsUpdate);
  }, []);

  const toggleExpanded = (id) => {
    setExpandedSubmissions((prev) => {
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

            {submissions.length === 0 ? (
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
                {submissions.map((s) => {
                  const expanded = expandedSubmissions.has(s.id);
                  return (
                    <div key={s.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-black truncate">{s.repoUrl.split('/').slice(-2).join('/')}</p>
                                <span className={`ml-2 ${getStatusColor(s.status)}`}>{s.status}</span>
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {s.emails.length} candidates • {formatDate(s.createdAt)}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => toggleExpanded(s.id)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors duration-200">
                            <svg className={`h-5 w-5 transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-6 pb-4 bg-gray-50 border-t border-gray-200">
                          <div className="mt-4 space-y-4">
                            {/* Candidates Section */}
                            <div>
                              <h4 className="text-sm font-medium text-black mb-3">Candidates ({s.emails.length} candidate{s.emails.length === 1 ? '' : 's'})</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {(s.emailStatuses || s.emails.map(email => ({ email, submitted: false }))).map((emailStatus, index) => (
                                  <div key={index} className={`p-3 rounded-md border ${emailStatus.submitted ? 'bg-[var(--secondary)]/20 border-[var(--secondary)]/40' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-black truncate">{emailStatus.email}</span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${emailStatus.submitted ? 'bg-[var(--secondary)]/30 text-[var(--primary)]' : 'bg-red-100 text-red-800'}`}>
                                        {emailStatus.submitted ? 'Submitted' : 'Incomplete'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Repository Details */}
                            <div>
                              <h4 className="text-sm font-medium text-black mb-2">Repository Details</h4>
                              <div className="bg-white p-3 rounded-md border border-gray-200">
                                <p className="text-sm text-black break-all">{s.repoUrl}</p>
                                <p className="text-xs text-gray-500 mt-1">Submitted on {formatDate(s.createdAt)}</p>
                              </div>
                            </div>

                            {/* Criteria Section */}
                            <div>
                              <h4 className="text-sm font-medium text-black mb-3">Criteria ({s.criteria ? s.criteria.length : 0})</h4>
                              {s.criteria && s.criteria.length > 0 ? (
                                <ul className="space-y-2">
                                  {s.criteria.map((crit, idx) => (
                                    <li key={idx} className="p-3 rounded-md border bg-[var(--primary)]/10 border-[var(--primary)]/30">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-[var(--primary)] truncate">{crit.name}</p>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/20 text-[var(--primary)]">Weight {crit.weight}</span>
                                      </div>
                                      <p className="text-sm text-[var(--primary)]/80 mt-1 whitespace-pre-wrap break-words">{crit.description}</p>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No criteria provided.</p>
                              )}
                            </div>
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