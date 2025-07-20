import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { addSubmission } from '../../src/utils/submissions';
import Head from 'next/head';

export default function SubmitPage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    repoOwner: '',
    repoName: '',
    githubUsernames: [], // keeps raw list for compatibility / dashboard
    candidates: [], // new: { name, githubUsername }
    criteria: [], // Each criterion: { name, description, weight }
  });

  // State for candidate input fields
  const [candidateInput, setCandidateInput] = useState({ name: '', githubUsername: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const router = useRouter();

  // State for the criterion inputs
  const [criteriaInput, setCriteriaInput] = useState({
    name: '',
    description: '',
    weight: ''
  });

  const handleRepoOwnerChange = (e) => {
    setFormData(prev => ({
      ...prev,
      repoOwner: e.target.value
    }));
  };

  const handleRepoNameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      repoName: e.target.value
    }));
  };

  const handleCandidateInputChange = (e) => {
    const { name, value } = e.target;
    setCandidateInput(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCandidate();
    }
  };

  const addCandidate = () => {
    const trimmedName = candidateInput.name.trim();
    const trimmedUsername = candidateInput.githubUsername.trim();

    // basic github username validation: alphanumeric, dashes, underscores, 1-39 chars
    const usernameValid = /^[a-zA-Z0-9-]{1,39}$/.test(trimmedUsername);

    if (trimmedName && usernameValid && !formData.githubUsernames.includes(trimmedUsername)) {
      setFormData(prev => ({
        ...prev,
        candidates: [...prev.candidates, { name: trimmedName, githubUsername: trimmedUsername }],
        githubUsernames: [...prev.githubUsernames, trimmedUsername], // maintain username list for compatibility
      }));

      setCandidateInput({ name: '', githubUsername: '' });
    }
  };

  const removeCandidate = (indexToRemove) => {
    setFormData(prev => {
      const updatedCandidates = prev.candidates.filter((_, idx) => idx !== indexToRemove);
      const updatedUsernames = updatedCandidates.map(c => c.githubUsername);
      return { ...prev, candidates: updatedCandidates, githubUsernames: updatedUsernames };
    });
  };

  const handleCriteriaInputChange = (e) => {
    const { name, value } = e.target;
    setCriteriaInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addCriterion = () => {
    const { name, description, weight } = criteriaInput;
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const weightNum = Number(weight);

    if (
      trimmedName &&
      trimmedDescription &&
      weightNum >= 1 &&
      weightNum <= 10
    ) {
      setFormData((prev) => ({
        ...prev,
        criteria: [
          ...prev.criteria,
          {
            name: trimmedName,
            description: trimmedDescription,
            weight: weightNum,
          },
        ],
      }));

      // Clear inputs
      setCriteriaInput({ name: '', description: '', weight: '' });
    }
  };

  const removeCriterion = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    const response = await fetch('/api/assign-repos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: process.env.NEXT_PUBLIC_GITHUB_TOKEN, // You can hardcode for now if needed
        templateOwner: formData.repoOwner,
        templateRepo: formData.repoName,
        baseRepoName: 'assignment',
        yourUsername: formData.repoOwner,
        studentList: formData.githubUsernames
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Repos created:', result.links);

      // Add assessment to backend
      try {
        if (!user || !user.sub) {
          console.error('User not authenticated');
          return;
        }

        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth0Id: user.sub,
            repo: {
              owner: formData.repoOwner,
              name: formData.repoName
            },
            candidates: formData.candidates,
            criteria: formData.criteria
          })
        });
        // Trigger dashboard update event
        window.dispatchEvent(new Event('submissionsUpdated'));
      } catch (err) {
        console.error('Error posting assessment:', err);
      }

      setSubmitStatus('success');
      window.dispatchEvent(new Event('submissionsUpdated'));
      setTimeout(() => router.push('/'), 500);
    } else {
  let errorMsg = 'Unknown error';
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMsg = errorData?.message || JSON.stringify(errorData);
    } else {
      errorMsg = await response.text();
    }
  } catch (parseError) {
    console.error('Error parsing error response:', parseError);
  }

  console.error('Repo creation failed:', errorMsg);
  setSubmitStatus('error');
}
  } catch (error) {
    console.error('Submission error:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};

  const validateForm = () => {
    return (
      formData.repoOwner.trim() &&
      formData.repoName.trim() &&
      formData.candidates.length > 0 &&
      formData.criteria.length > 0
    );
  };

  return (
    <>
      <Head>
        <title>Create Assessment - SkillBranch</title>
        <meta name="description" content="Create a new assessment by specifying repository, candidates and criteria" />
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
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Create Assessment
            </h1>
            <p className="text-lg text-slate-400">
              Provide the repository URL, your list of candidates, and evaluation criteria to create a new assessment.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Repository Owner and Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="repoOwner" className="block text-sm font-medium text-white mb-2">
                      Repository Owner *
                    </label>
                    <input
                      type="text"
                      id="repoOwner"
                      value={formData.repoOwner}
                      onChange={handleRepoOwnerChange}
                      placeholder="GitHub username or organization"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="repoName" className="block text-sm font-medium text-white mb-2">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      id="repoName"
                      value={formData.repoName}
                      onChange={handleRepoNameChange}
                      placeholder="Repository name"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Candidate List Field */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Candidate List *
                  </label>
                  <p className="text-sm text-slate-400 mb-4">
                    Provide a name and GitHub username, then add each candidate to the list
                  </p>

                  {/* Inputs for candidate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      name="name"
                      value={candidateInput.name}
                      onChange={handleCandidateInputChange}
                      onKeyDown={handleCandidateKeyDown}
                      placeholder="Candidate name"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <input
                      type="text"
                      name="githubUsername"
                      value={candidateInput.githubUsername}
                      onChange={handleCandidateInputChange}
                      onKeyDown={handleCandidateKeyDown}
                      placeholder="GitHub username"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addCandidate}
                    disabled={
                      !candidateInput.name.trim() ||
                      !/^[a-zA-Z0-9-]{1,39}$/.test(candidateInput.githubUsername.trim()) ||
                      formData.githubUsernames.includes(candidateInput.githubUsername.trim())
                    }
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Candidate
                  </button>

                  {/* Candidate Chips */}
                  {formData.candidates.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {formData.candidates.map((cand, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-slate-700/50 text-white px-4 py-2 rounded-lg text-sm border border-slate-600"
                        >
                          <span>{cand.name} — {cand.githubUsername}</span>
                          <button
                            type="button"
                            onClick={() => removeCandidate(index)}
                            className="ml-2 text-slate-400 hover:text-red-400 focus:outline-none transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Criteria List Field */}
                <div>
                  <label htmlFor="criteriaName" className="block text-sm font-medium text-white mb-2">
                    Criteria List *
                  </label>
                  <p className="text-sm text-slate-400 mb-4">
                    Provide a name, description and weight (1-10) for each criterion, then add it to the list
                  </p>

                  {/* Inputs for criterion */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      id="criteriaName"
                      name="name"
                      value={criteriaInput.name}
                      onChange={handleCriteriaInputChange}
                      placeholder="Criterion name"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <textarea
                      id="criteriaDescription"
                      name="description"
                      value={criteriaInput.description}
                      onChange={handleCriteriaInputChange}
                      placeholder="Criterion description"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />

                    <input
                      type="number"
                      id="criteriaWeight"
                      name="weight"
                      value={criteriaInput.weight}
                      onChange={handleCriteriaInputChange}
                      placeholder="Weight (1 - 10)"
                      min={1}
                      max={10}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <button
                      type="button"
                      onClick={addCriterion}
                      disabled={
                        !criteriaInput.name.trim() ||
                        !criteriaInput.description.trim() ||
                        !(Number(criteriaInput.weight) >= 1 && Number(criteriaInput.weight) <= 10)
                      }
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Criterion
                    </button>
                  </div>

                  {/* Criteria Items */}
                  {formData.criteria.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {formData.criteria.map((criterion, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white mb-1">
                              {criterion.name} (Weight: {criterion.weight})
                            </p>
                            <p className="text-sm text-slate-400">
                              {criterion.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCriterion(index)}
                            className="ml-4 text-slate-400 hover:text-red-400 focus:outline-none transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={!validateForm() || isSubmitting}
                    className={`w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 ${
                      !validateForm() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </div>
                    ) : (
                      'Create Assessment'
                    )}
                  </button>
                </div>
              </form>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-200">
                        Assessment created successfully! Redirecting to dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-200">
                        Submission failed
                      </p>
                      <p className="text-sm text-red-300 mt-1">
                        There was an error submitting your data. Please try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
