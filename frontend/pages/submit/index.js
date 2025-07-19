import { useState } from 'react';
import { useRouter } from 'next/router';
import { addSubmission } from '../../src/utils/submissions';
import Head from 'next/head';

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    repoUrl: '',
    emails: []
  });
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const router = useRouter();

  const handleRepoUrlChange = (e) => {
    setFormData(prev => ({
      ...prev,
      repoUrl: e.target.value
    }));
  };

  const handleEmailInputChange = (e) => {
    setEmailInput(e.target.value);
  };

  const handleEmailInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !formData.emails.includes(email)) {
      setFormData(prev => ({
        ...prev,
        emails: [...prev.emails, email]
      }));
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter(email => email !== emailToRemove)
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
    return formData.repoUrl.trim() && formData.emails.length > 0;
  };

  return (
    <>
      <Head>
        <title>Hackthe6ix - Submit Repository</title>
        <meta name="description" content="Submit your repository for processing" />
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

        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">
                Repository Submission
              </h1>
              <p className="text-gray-600">
                Submit your repository URL and email list for processing
              </p>
            </div>

            <div className="card p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Repository URL Field */}
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-medium text-black mb-2">
                    Repository URL *
                  </label>
                  <input
                    type="url"
                    id="repoUrl"
                    value={formData.repoUrl}
                    onChange={handleRepoUrlChange}
                    placeholder="https://github.com/username/repository"
                    className="input-field"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the full URL to your repository
                  </p>
                </div>

                {/* Email List Field */}
                <div>
                  <label htmlFor="emailInput" className="block text-sm font-medium text-black mb-2">
                    Email List *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="emailInput"
                      value={emailInput}
                      onChange={handleEmailInputChange}
                      onKeyDown={handleEmailInputKeyDown}
                      placeholder="Type email and press Enter"
                      className="input-field pr-20"
                    />
                    <button
                      type="button"
                      onClick={addEmail}
                      disabled={!emailInput.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                  {/* Email Tags */}
                  {formData.emails.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.emails.map((email, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => removeEmail(email)}
                            className="ml-1 text-green-600 hover:text-green-800 focus:outline-none transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Type an email address and press Enter to add it to the list
                  </p>
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