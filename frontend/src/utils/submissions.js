// Utility functions for managing submissions
const STORAGE_KEY = 'repository_submissions';

// Get all submissions from localStorage
export const getSubmissions = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading submissions from localStorage:', error);
    return [];
  }
};

// Save submissions to localStorage
export const saveSubmissions = (submissions) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Error saving submissions to localStorage:', error);
  }
};

// Add a new submission
export const addSubmission = (submission) => {
  const submissions = getSubmissions();
  // Support both old (emails) and new (githubUsernames/candidates) formats
  let emailStatuses = [];
  if (submission.emails && Array.isArray(submission.emails)) {
    emailStatuses = submission.emails.map(email => ({
      email: email,
      submitted: false,
      submittedAt: null
    }));
  } else if (submission.githubUsernames && Array.isArray(submission.githubUsernames)) {
    // For new format, treat githubUsername as 'email' for status tracking
    emailStatuses = submission.githubUsernames.map(username => ({
      email: username,
      submitted: false,
      submittedAt: null
    }));
  } else if (submission.candidates && Array.isArray(submission.candidates)) {
    emailStatuses = submission.candidates.map(cand => ({
      email: cand.githubUsername || cand.email || '',
      submitted: false,
      submittedAt: null
    }));
  }
  const newSubmission = {
    ...submission,
    id: Date.now(), // Simple ID generation
    status: 'pending',
    createdAt: new Date().toISOString(),
    emailStatuses
  };
  const updatedSubmissions = [newSubmission, ...submissions]; // Add to beginning
  saveSubmissions(updatedSubmissions);
  return newSubmission;
};

// Update a submission
export const updateSubmission = (id, updates) => {
  const submissions = getSubmissions();
  const updatedSubmissions = submissions.map(submission => 
    submission.id === id ? { ...submission, ...updates } : submission
  );
  saveSubmissions(updatedSubmissions);
};

// Update email status within a submission
export const updateEmailStatus = (submissionId, email, submitted) => {
  const submissions = getSubmissions();
  const updatedSubmissions = submissions.map(submission => {
    if (submission.id === submissionId) {
      const updatedEmailStatuses = submission.emailStatuses.map(emailStatus => {
        if (emailStatus.email === email) {
          return {
            ...emailStatus,
            submitted: submitted,
            submittedAt: submitted ? new Date().toISOString() : null
          };
        }
        return emailStatus;
      });
      return { ...submission, emailStatuses: updatedEmailStatuses };
    }
    return submission;
  });
  saveSubmissions(updatedSubmissions);
};

// Delete a submission
export const deleteSubmission = (id) => {
  const submissions = getSubmissions();
  const updatedSubmissions = submissions.filter(submission => submission.id !== id);
  saveSubmissions(updatedSubmissions);
};

// Get submission by ID
export const getSubmissionById = (id) => {
  const submissions = getSubmissions();
  return submissions.find(submission => submission.id === id);
}; 