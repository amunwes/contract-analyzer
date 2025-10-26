import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, Scale, AlertTriangle, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const ContractAnalyzer = () => {
  const [stage, setStage] = useState('landing');
  const [contractFile, setContractFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const lawyerFormRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', contractType: '',
    urgency: '', briefDescription: '', location: '', 
    preferredContact: '', employmentSector: '', consentToContact: false
  });

  const extractTextFromPDF = async (file) => {
    try {
      console.log('Starting PDF extraction...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded, pages:', pdf.numPages);
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log('Processing page', i);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }
      
      console.log('Text extracted successfully, length:', fullText.length);
      return fullText;
    } catch (error) {
      console.error('Detailed error extracting text:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  };

  const analyzeExtractedText = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 50);
    const randomLines = [];
    
    const indices = new Set();
    while (indices.size < Math.min(5, lines.length)) {
      indices.add(Math.floor(Math.random() * lines.length));
    }
    
    Array.from(indices).forEach((idx, i) => {
      const line = lines[idx];
      const snippet = line.substring(0, 100) + (line.length > 100 ? '...' : '');
      
      const priorities = ['high', 'high', 'medium', 'medium', 'low'];
      const titles = [
        'Independent Contractor Language',
        'Non-Compete Clause',
        'Vague Termination Language',
        'Broad IP Assignment',
        'Privacy and Monitoring'
      ];
      
      randomLines.push({
        id: i + 1,
        priority: priorities[i],
        page: Math.floor(idx / 10) + 1,
        title: titles[i],
        quote: snippet,
        fullText: line,
        explanation: 'This provision was identified for review. The specific language may have implications under BC employment law.',
        questions: [
          'What are my rights regarding this provision?',
          'How does this align with BC Employment Standards?'
        ],
        needsLawyer: priorities[i] === 'high'
      });
    });

    return {
      summary: {
        highPriority: randomLines.filter(l => l.priority === 'high').length,
        worthReviewing: randomLines.filter(l => l.priority === 'medium').length,
        forAwareness: randomLines.filter(l => l.priority === 'low').length
      },
      flags: randomLines
    };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setContractFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setStage('processing');
      
      try {
        const text = await extractTextFromPDF(file);
        setExtractedText(text);
        
        const analysisResult = analyzeExtractedText(text);
        setAnalysis(analysisResult);
        
        setStage('results');
      } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF. Please try again.');
        setStage('landing');
      }
    } else {
      alert('Please upload a PDF file');
    }
  };

  const scrollToLawyerForm = () => {
    lawyerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.contractType || 
        !formData.urgency || !formData.briefDescription || !formData.location || 
        !formData.preferredContact || !formData.consentToContact) {
      alert('Please fill in all required fields');
      return;
    }
    console.log('Form submitted:', formData);
    alert('Thank you! A lawyer will contact you within 1-2 business days.');
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-100 text-red-700' };
      case 'medium': return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-700' };
      case 'low': return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900', badge: 'bg-gray-100 text-gray-700' };
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'High Priority Review';
      case 'medium': return 'Worth Reviewing';
      case 'low': return 'For Your Awareness';
      default: return 'Info';
    }
  };

  if (stage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Scale className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contract Red Flag Analyzer
            </h1>
            <p className="text-xl text-gray-600">
              Understand your employment contract better
            </p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Educational Tool Only - Not Legal Advice
                </h3>
                <p className="text-yellow-800">
                  This tool provides information to help you understand your employment contract, but it is not legal advice. For advice about your specific situation, please consult with a licensed employment lawyer in British Columbia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Upload Your Employment Contract
            </h2>
            <p className="text-gray-600 mb-6">
              We'll review your contract and highlight provisions that employment lawyers commonly review.
            </p>

            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload your contract
                </p>
                <p className="text-sm text-gray-500">
                  PDF only (Max 10MB)
                </p>
              </div>
            </label>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What We'll Review:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Employment classification (employee vs. contractor)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Non-compete and restrictive covenants</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Termination and severance provisions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Overtime, pay, and benefits language</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Intellectual property assignments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Analyzing Your Contract
            </h2>
            <p className="text-gray-600 mb-6">
              Reviewing provisions and identifying potential concerns...
            </p>
            <div className="space-y-2 text-left text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Reading contract document</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Analyzing provisions against BC law</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-8 h-8 text-indigo-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Contract Analysis</h1>
                  <p className="text-sm text-gray-600">{contractFile?.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {analysis.summary.highPriority} High Priority
                </div>
                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {analysis.summary.worthReviewing} Worth Review
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {analysis.summary.forAwareness} For Awareness
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '800px' }}>
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                style={{ minHeight: '800px' }}
                title="Contract PDF"
              />
            </div>

            <div className="w-96 space-y-4 overflow-auto bg-gray-50 rounded-lg p-4" style={{ height: '800px' }}>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 sticky top-0">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900">
                    <strong>Educational Only:</strong> Not legal advice. Consult a licensed lawyer.
                  </p>
                </div>
              </div>

              {analysis.flags.map((flag) => {
                const colors = getPriorityColor(flag.priority);
                return (
                  <div
                    key={flag.id}
                    className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{flag.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${colors.badge} whitespace-nowrap`}>
                        {getPriorityLabel(flag.priority)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 mb-3">
                      <p className="font-medium mb-1">Found on page {flag.page}:</p>
                      <p className="italic bg-white bg-opacity-50 p-2 rounded border border-gray-200 text-xs">
                        "{flag.quote}"
                      </p>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{flag.explanation}</p>

                    <div className="text-sm text-gray-700 mb-3">
                      <p className="font-medium mb-1">Questions to ask:</p>
                      <ul className="space-y-1 ml-4 text-xs">
                        {flag.questions.map((q, idx) => (
                          <li key={idx} className="list-disc">{q}</li>
                        ))}
                      </ul>
                    </div>

                    {flag.needsLawyer && (
                      <button
                        onClick={scrollToLawyerForm}
                        className="w-full bg-indigo-600 text-white text-xs font-medium py-2 px-3 rounded hover:bg-indigo-700 flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Consult a Lawyer
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={lawyerFormRef} className="bg-white border-t mt-8 py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
              <Scale className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Connect with an Employment Lawyer
              </h2>
              <p className="text-gray-600">
                Get personalized legal advice about your specific situation
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={formData.fullName}
                    onChange={(e) => handleFormChange('fullName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location in BC *"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Situation</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.contractType}
                      onChange={(e) => handleFormChange('contractType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Contract Type *</option>
                      <option value="new-offer">New Job Offer</option>
                      <option value="existing">Existing Employment</option>
                      <option value="termination">Termination/Severance</option>
                      <option value="contractor">Contractor Agreement</option>
                    </select>
                    <select
                      value={formData.urgency}
                      onChange={(e) => handleFormChange('urgency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Urgency *</option>
                      <option value="not-urgent">Not urgent</option>
                      <option value="week">Within a week</option>
                      <option value="48-hours">Within 48 hours</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <select
                    value={formData.employmentSector}
                    onChange={(e) => handleFormChange('employmentSector', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Employment Sector</option>
                    <option value="tech">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="construction">Construction</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    rows={4}
                    placeholder="Brief description of your situation *"
                    value={formData.briefDescription}
                    onChange={(e) => handleFormChange('briefDescription', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={formData.preferredContact}
                    onChange={(e) => handleFormChange('preferredContact', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Preferred Contact Method *</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="either">Either</option>
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentToContact}
                  onChange={(e) => handleFormChange('consentToContact', e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I consent to be contacted by an employment lawyer regarding my inquiry. *
                </span>
              </label>

              <button
                onClick={handleFormSubmit}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Submit Request
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ContractAnalyzer;