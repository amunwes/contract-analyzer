import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';

const AnalysisSidebar = ({ 
  analysisResults, 
  selectedText,
  onCopyText, 
  onConsultLawyer 
}) => {
  const [expandedSections, setExpandedSections] = useState(
    analysisResults.map((_, i) => i === 0) // Only first section expanded by default
  );

  const toggleSection = (index) => {
    setExpandedSections(prev => {
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  };

  const totalRedFlags = analysisResults.reduce(
    (sum, result) => sum + (result.redFlags?.length || 0), 
    0
  );

  return (
    <div className="w-96 space-y-4 overflow-auto bg-gray-50 rounded-lg p-4" style={{ maxHeight: '85vh' }}>
      {/* Summary Card */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
        <h3 className="font-semibold text-indigo-900 mb-2">Contract Analysis</h3>
        <div className="space-y-1 text-sm text-indigo-800">
          <p>📄 {analysisResults.length} section{analysisResults.length !== 1 ? 's' : ''} analyzed</p>
          <p className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {totalRedFlags} potential red flag{totalRedFlags !== 1 ? 's' : ''} identified
          </p>
        </div>
      </div>

      {/* Selected Text */}
      {selectedText && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Selected Text</h3>
          <p className="text-sm text-gray-700 mb-3 italic max-h-32 overflow-auto">
            "{selectedText}"
          </p>
          <button
            onClick={() => onCopyText(selectedText)}
            className="w-full bg-green-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Text
          </button>
        </div>
      )}

      {/* Analysis Sections */}
      <div className="space-y-3">
        {analysisResults.map((result, index) => (
          <div key={index} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  Page {result.sectionNumber}
                </h3>
                {result.redFlags && result.redFlags.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {result.redFlags.length} ⚠️
                  </span>
                )}
              </div>
              {expandedSections[index] ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Expanded Content */}
            {expandedSections[index] && (
              <div className="p-4 pt-0 space-y-4">
                {/* Simplified Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">📖</span>
                    Simple Explanation
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.simplified}
                  </p>
                </div>

                {/* Red Flags */}
                {result.redFlags && result.redFlags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Potential Issues
                    </h4>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, flagIndex) => (
                        <li key={flagIndex} className="text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-400">
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error Message */}
                {result.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ {result.error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Consult Lawyer CTA */}
      {totalRedFlags > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Found Concerning Items?
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            We identified {totalRedFlags} potential issue{totalRedFlags !== 1 ? 's' : ''} that may need legal review.
          </p>
          <button
            onClick={onConsultLawyer}
            className="w-full bg-yellow-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-yellow-700 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Connect with a Lawyer
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisSidebar;