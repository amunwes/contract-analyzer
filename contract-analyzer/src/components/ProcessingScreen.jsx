import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

const ProcessingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full mx-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Loading Your Contract
          </h2>
          <p className="text-gray-600 mb-6">
            Preparing PDF for review...
          </p>
          <div className="space-y-2 text-left text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Reading contract document</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Rendering pages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingScreen;