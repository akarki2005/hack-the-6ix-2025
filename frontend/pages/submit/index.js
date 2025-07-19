import { useState } from 'react';
import { useRouter } from 'next/router';
import { addSubmission } from '../../src/utils/submissions';
import Head from 'next/head';

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    repoUrl: '',
    emails: [], // keeps raw list for compatibility / dashboard
    candidates: [], // new: { name, email }
    criteria: [], // Each criterion: { name, description, weight }
  });

  // State for candidate input fields
  const [candidateInput, setCandidateInput] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const router = useRouter();

  // State for the criterion inputs
  const [criteriaInput, setCriteriaInput] = useState({
    name: '',
    description: '',
    weight: ''
  });

  const handleRepoUrlChange = (e) => {
    setFormData(prev => ({
      ...prev,
      repoUrl: e.target.value
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
    const trimmedEmail = candidateInput.email.trim();

    // basic email regex for quick validation
    const emailValid = /.+@.+\..+/.test(trimmedEmail);

    if (trimmedName && emailValid && !formData.emails.includes(trimmedEmail)) {
      setFormData(prev => ({
        ...prev,
        candidates: [...prev.candidates, { name: trimmedName, email: trimmedEmail }],
        emails: [...prev.emails, trimmedEmail], // maintain email list for compatibility
      }));

      setCandidateInput({ name: '', email: '' });
    }
  };

  const removeCandidate = (indexToRemove) => {
    setFormData(prev => {
      const updatedCandidates = prev.candidates.filter((_, idx) => idx !== indexToRemove);
      const updatedEmails = updatedCandidates.map(c => c.email);
      return { ...prev, candidates: updatedCandidates, emails: updatedEmails };
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
      addSubmission(formData);
      window.dispatchEvent(new Event('submissionsUpdated'));
      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    return (
      formData.repoUrl.trim() &&
      formData.candidates.length > 0 &&
      formData.criteria.length > 0
    );
  };

  return (
    <>
      <Head>
        <title>Hackthe6ix - Create Assessment</title>
        <meta name="description" content="Create a new assessment by specifying repository, candidates and criteria" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-4">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-black">Hackthe6ix</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                Create Assessment
              </h1>
              <p className="text-gray-600">
                Provide the repository URL, your list of candidates, and evaluation criteria to create a new assessment.
              </p>
            </div>

            <div className="card p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Repository URL Field */}
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-medium text-black mb-1">
                    Repository URL *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Enter the full HTTPS link to the GitHub repository you want to assess
                  </p>
                  <input
                    type="url"
                    id="repoUrl"
                    value={formData.repoUrl}
                    onChange={handleRepoUrlChange}
                    placeholder="https://github.com/username/repository"
                    className="input-field"
                    required
                  />
                  {/* info text moved above */}
                </div>

                {/* Candidate List Field */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Candidate List *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Provide a name and email, then add each candidate to the list
                  </p>

                  {/* Inputs for candidate */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={candidateInput.name}
                      onChange={handleCandidateInputChange}
                      onKeyDown={handleCandidateKeyDown}
                      placeholder="Candidate name"
                      className="input-field"
                    />

                    <input
                      type="email"
                      name="email"
                      value={candidateInput.email}
                      onChange={handleCandidateInputChange}
                      onKeyDown={handleCandidateKeyDown}
                      placeholder="Candidate email"
                      className="input-field"
                    />

                    <button
                      type="button"
                      onClick={addCandidate}
                      disabled={
                        !candidateInput.name.trim() ||
                        !/.+@.+\..+/.test(candidateInput.email.trim()) ||
                        formData.emails.includes(candidateInput.email.trim())
                      }
                      className="btn-primary px-4 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add Candidate
                    </button>
                  </div>

                  {/* Candidate Chips */}
                  {formData.candidates.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.candidates.map((cand, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[var(--secondary)]/30 text-[var(--primary)] px-3 py-1 rounded-full text-sm"
                        >
                          <span>{cand.name} — {cand.email}</span>
                          <button
                            type="button"
                            onClick={() => removeCandidate(index)}
                            className="ml-1 text-[var(--primary)] hover:text-[var(--primary-hover)] focus:outline-none transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* info text moved above */}
                </div>

                {/* Criteria List Field */}
                <div>
                  <label htmlFor="criteriaName" className="block text-sm font-medium text-black mb-1">
                    Criteria List *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Provide a name, description and weight (1-10) for each criterion, then add it to the list
                  </p>

                  {/* Inputs for criterion */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      id="criteriaName"
                      name="name"
                      value={criteriaInput.name}
                      onChange={handleCriteriaInputChange}
                      placeholder="Criterion name"
                      className="input-field"
                    />

                    <textarea
                      id="criteriaDescription"
                      name="description"
                      value={criteriaInput.description}
                      onChange={handleCriteriaInputChange}
                      placeholder="Criterion description"
                      rows={2}
                      className="input-field"
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
                      className="input-field"
                    />

                    <button
                      type="button"
                      onClick={addCriterion}
                      disabled={
                        !criteriaInput.name.trim() ||
                        !criteriaInput.description.trim() ||
                        !(Number(criteriaInput.weight) >= 1 && Number(criteriaInput.weight) <= 10)
                      }
                      className="btn-primary px-4 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add Criterion
                    </button>
                  </div>

                  {/* Criteria Items */}
                  {formData.criteria.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {formData.criteria.map((criterion, index) => (
                        <li
                          key={index}
                          className="flex items-start justify-between bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-md p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-[var(--primary)]">
                              {criterion.name} (Weight: {criterion.weight})
                            </p>
                            <p className="text-sm text-[var(--primary)]/80">
                              {criterion.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCriterion(index)}
                            className="ml-3 text-[var(--primary)] hover:text-[var(--primary-hover)] focus:outline-none transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* info text moved above */}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!validateForm() || isSubmitting}
                  className={`w-full btn-primary ${
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
                    'Submit'
                  )}
                </button>
              </form>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Submission successful! Redirecting to dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        Submission failed
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        There was an error submitting your data. Please try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 