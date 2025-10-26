// src/services/anthropicService.js
// Updated to call our backend instead of Anthropic API directly

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Analyzes a section of contract text using our backend
 * @param {string} sectionText - The text to analyze
 * @param {number} sectionNumber - The section/page number
 * @returns {Promise<{simplified: string, redFlags: string[]}>}
 */
export const analyzeContractSection = async (sectionText, sectionNumber) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sectionText,
        sectionNumber
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing section:', error);
    throw error;
  }
};

/**
 * Analyzes an entire PDF by splitting it into sections
 * @param {string} fullText - The complete extracted PDF text
 * @param {number} totalPages - Total number of pages
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Array of analysis results
 */
export const analyzeEntireContract = async (fullText, totalPages, onProgress) => {
  // Split text by page markers
  const pageRegex = /--- Page (\d+) ---\n([\s\S]*?)(?=\n--- Page \d+ ---|$)/g;
  const sections = [];
  let match;

  while ((match = pageRegex.exec(fullText)) !== null) {
    sections.push({
      pageNumber: parseInt(match[1]),
      text: match[2].trim()
    });
  }

  if (sections.length === 0) {
    // Fallback: treat entire text as one section
    sections.push({
      pageNumber: 1,
      text: fullText
    });
  }

  const results = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    if (onProgress) {
      onProgress(i + 1, sections.length);
    }

    try {
      const analysis = await analyzeContractSection(section.text, section.pageNumber);
      results.push(analysis);
    } catch (error) {
      console.error(`Error analyzing page ${section.pageNumber}:`, error);
      results.push({
        sectionNumber: section.pageNumber,
        simplified: 'Error analyzing this section',
        redFlags: [],
        error: error.message
      });
    }
  }

  return results;
};