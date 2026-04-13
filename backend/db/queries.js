import db from './index.js';

// Used by Issue 6: lawyer form submission
export async function insertLawyerInquiry(inquiry) {
  return db('lawyer_inquiries').insert(inquiry);
}

// Used by Issue 5: feedback persistence
export async function insertFeedback(feedback) {
  return db('feedback').insert(feedback);
}

// Used by Issue 5: retrieve feedback for an analysis
export async function getFeedbackByAnalysisId(analysisId) {
  return db('feedback').where({ analysis_id: analysisId }).select('*');
}
