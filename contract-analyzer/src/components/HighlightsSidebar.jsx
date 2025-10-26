import React from 'react';
import { AlertTriangle, Copy, ExternalLink } from 'lucide-react';

const HighlightsSidebar = ({ 
  selectedText, 
  highlights, 
  onAddHighlight, 
  onCopyHighlight, 
  onRemoveHighlight,
  onConsultLawyer 
}) => {
  return (
    <div className="w-96 space-y-4 overflow-auto bg-gray-50 rounded-lg p-4" style={{ maxHeight: '85vh' }}>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
        <p className="text-sm text-blue-800">
          Select text in the PDF to highlight it, or view automatically detected passages below.
        </p>
      </div>

      {selectedText && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Selected Text</h3>
          <p className="text-sm text-gray-700 mb-3 italic max-h-32 overflow-auto">
            "{selectedText}"
          </p>
          <button
            onClick={onAddHighlight}
            className="w-full bg-green-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-green-700"
          >
            Add Highlight
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Your Highlights ({highlights.length})
        </h3>
        
        {highlights.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No highlights yet. Select text to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {highlights.map((highlight) => (
              <div 
                key={highlight.id} 
                className="bg-yellow-50 border border-yellow-200 rounded p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    {highlight.page && (
                      <span className="text-xs text-gray-600">Page {highlight.page}</span>
                    )}
                    {highlight.keywords && (
                      <div className="flex gap-1 flex-wrap">
                        {highlight.keywords.map((keyword, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCopyHighlight(highlight.text)}
                      className="text-gray-600 hover:text-indigo-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveHighlight(highlight.id)}
                      className="text-gray-600 hover:text-red-600 text-lg font-bold leading-none"
                      title="Remove highlight"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-800">"{highlight.text}"</p>
                <p className="text-xs text-gray-500 mt-1">{highlight.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onConsultLawyer}
        className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        Consult a Lawyer
      </button>
    </div>
  );
};

export default HighlightsSidebar;