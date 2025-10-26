import React, { useState, useRef, useEffect } from 'react';
import LandingPage from './LandingPage';
import ProcessingScreen from './ProcessingScreen';
import ResultsView from './ResultsView';
import { extractTextFromPDF, renderAllPages } from '../utils/pdfUtils';
import './styles.css';

const ContractAnalyzer = () => {
  const [stage, setStage] = useState('landing');
  const [contractFile, setContractFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [renderedPages, setRenderedPages] = useState([]);
  const lawyerFormRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '', 
    email: '', 
    phoneNumber: '', 
    contractType: '',
    urgency: '', 
    briefDescription: '', 
    location: '', 
    preferredContact: '', 
    employmentSector: '', 
    consentToContact: false
  });

  // Handle PDF upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setContractFile(file);
      setStage('processing');
      
      try {
        const { pdf, fullText } = await extractTextFromPDF(file);
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setExtractedText(fullText);
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

  // Render all pages when PDF doc is loaded
  useEffect(() => {
    const renderPages = async () => {
      if (pdfDoc && stage === 'results') {
        const pages = await renderAllPages(pdfDoc);
        setRenderedPages(pages);
      }
    };
    renderPages();
  }, [pdfDoc, stage]);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      console.log('Selected text:', text);
    }
  };

  // Add highlight to sidebar
  const addHighlight = () => {
    if (selectedText) {
      const newHighlight = {
        id: Date.now(),
        text: selectedText,
        timestamp: new Date().toLocaleString()
      };
      setHighlights([...highlights, newHighlight]);
      setSelectedText('');
      window.getSelection().removeAllRanges();
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Remove highlight
  const removeHighlight = (id) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  // Scroll to lawyer form
  const scrollToLawyerForm = () => {
    lawyerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submit
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

  // Render based on stage
  if (stage === 'landing') {
    return <LandingPage onFileUpload={handleFileUpload} />;
  }

  if (stage === 'processing') {
    return <ProcessingScreen />;
  }

  if (stage === 'results') {
    return (
      <ResultsView
        contractFile={contractFile}
        totalPages={totalPages}
        renderedPages={renderedPages}
        selectedText={selectedText}
        highlights={highlights}
        formData={formData}
        lawyerFormRef={lawyerFormRef}
        onTextSelection={handleTextSelection}
        onAddHighlight={addHighlight}
        onCopyHighlight={copyToClipboard}
        onRemoveHighlight={removeHighlight}
        onScrollToLawyer={scrollToLawyerForm}
        onFormChange={handleFormChange}
        onFormSubmit={handleFormSubmit}
      />
    );
  }

  return null;
};

export default ContractAnalyzer;