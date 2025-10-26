import React from 'react';
import { Scale } from 'lucide-react';
import PDFViewer from './PDFViewer';
import HighlightsSidebar from './HighlightsSidebar';
import LawyerForm from './LawyerForm';

const ResultsView = ({
  contractFile,
  totalPages,
  renderedPages,
  selectedText,
  highlights,
  formData,
  lawyerFormRef,
  onTextSelection,
  onAddHighlight,
  onCopyHighlight,
  onRemoveHighlight,
  onScrollToLawyer,
  onFormChange,
  onFormSubmit
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Contract Review</h1>
                <p className="text-sm text-gray-600">
                  {contractFile?.name} • {totalPages} pages
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-4">
          <PDFViewer 
            renderedPages={renderedPages}
            onTextSelection={onTextSelection}
          />
          
          <HighlightsSidebar
            selectedText={selectedText}
            highlights={highlights}
            onAddHighlight={onAddHighlight}
            onCopyHighlight={onCopyHighlight}
            onRemoveHighlight={onRemoveHighlight}
            onConsultLawyer={onScrollToLawyer}
          />
        </div>
      </div>

      <LawyerForm
        formData={formData}
        onChange={onFormChange}
        onSubmit={onFormSubmit}
        formRef={lawyerFormRef}
      />
    </div>
  );
};

export default ResultsView;