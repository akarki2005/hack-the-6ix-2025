import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSubmissions } from '../src/utils/submissions';
import Head from 'next/head';

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());

  // Load submissions from localStorage on component mount
  useEffect(() => {
    const loadSubmissions = () => {
      const storedSubmissions = getSubmissions();
      setSubmissions(storedSubmissions);
    };

    // Load initial data
    loadSubmissions();

    // Listen for updates from the submit page
    const handleSubmissionsUpdate = () => {
      loadSubmissions();
    };

    window.addEventListener('submissionsUpdated', handleSubmissionsUpdate);

    // Cleanup event listener
    return () => {
      window.removeEventListener('submissionsUpdated', handleSubmissionsUpdate);
    };
  }, []);

  const toggleExpanded = (submissionId) => {
    setExpandedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head>
        <title>Hackthe6ix - Dashboard</title>
        <meta name="description" content="Repository submissions dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-black">Hackthe6ix</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Title */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold text-black">Dashboard</h2>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                  <p className="text-2xl font-bold text-black">{submissions.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-black">
                    {submissions.filter(s => s.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-black">
                    {submissions.filter(s => s.status === 'processing').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-black">
                    {submissions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-black">Submissions</h3>
                  <p className="text-sm text-gray-500 mt-1">A list of all your repository submissions and their current status.</p>
                </div>
                <Link
                  href="/submit"
                  className="btn-primary inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Submission
                </Link>
              </div>
            </div>
            
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-black mb-2">No submissions</h3>
                <p className="text-gray-500 mb-6">Get started by creating a new submission.</p>
                <Link
                  href="/submit"
                  className="btn-primary inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Submission
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map((submission) => {
                  const isExpanded = expandedSubmissions.has(submission.id);
                  
                  return (
                    <div key={submission.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-black truncate">
                                  {submission.repoUrl.split('/').slice(-2).join('/')}
                                </p>
                                <span className={`ml-2 ${getStatusColor(submission.status)}`}>
                                  {submission.status}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <p className="truncate">{submission.repoUrl}</p>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <p>{submission.emails.length} email(s) • {formatDate(submission.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => toggleExpanded(submission.id)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors duration-200"
                          >
                            <svg 
                              className={`h-5 w-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-6 pb-4 bg-gray-50 border-t border-gray-200">
                          <div className="mt-4 space-y-4">
                            {/* Emails Section */}
                            <div>
                              <h4 className="text-sm font-medium text-black mb-3">Email List ({submission.emails.length} emails)</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {(submission.emailStatuses || submission.emails.map(email => ({ email, submitted: false }))).map((emailStatus, index) => (
                                  <div 
                                    key={index}
                                    className={`p-3 rounded-md border ${
                                      emailStatus.submitted 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-red-50 border-red-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-black truncate">
                                        {emailStatus.email}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        emailStatus.submitted 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {emailStatus.submitted ? (
                                          <>
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Submitted
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Incomplete
                                          </>
                                        )}
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
                                <p className="text-sm text-black break-all">{submission.repoUrl}</p>
                                <p className="text-xs text-gray-500 mt-1">Submitted on {formatDate(submission.createdAt)}</p>
                              </div>
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