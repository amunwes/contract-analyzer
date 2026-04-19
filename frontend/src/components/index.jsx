import React, { useEffect, useRef, useState } from "react";
import { analyzeContractWithStreaming } from "../services/anthropicService";
import { extractTextFromPDF, renderAllPages } from "../utils/pdfUtils";
import LandingPage from "./LandingPage";
import ProcessingScreen from "./ProcessingScreen";
import ResultsView from "./ResultsView";
import "./styles.css";

const ContractAnalyzer = () => {
	const [stage, setStage] = useState("landing");
	const [_contractFile, setContractFile] = useState(null);
	const [pdfDoc, setPdfDoc] = useState(null);
	const [_extractedText, setExtractedText] = useState("");
	const [selectedText, setSelectedText] = useState("");
	const [renderedPages, setRenderedPages] = useState([]);
	const [analysisResults, setAnalysisResults] = useState({
		sections: [],
		overallScore: null,
		riskLevel: null,
		topConcerns: [],
		analysisId: null,
	});
	const [analysisProgress, setAnalysisProgress] = useState({
		sectionsReceived: 0,
		currentSectionTitle: null,
	});
	const lawyerFormRef = useRef(null);

	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		phoneNumber: "",
		contractType: "",
		urgency: "",
		briefDescription: "",
		location: "",
		preferredContact: "",
		employmentSector: "",
		consentToContact: false,
	});

	// Handle PDF upload
	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (file && file.type === "application/pdf") {
			setContractFile(file);
			setStage("processing");

			try {
				// Extract text from PDF
				const { pdf, fullText } = await extractTextFromPDF(file);
				setPdfDoc(pdf);
				setExtractedText(fullText);

				// Analyze the contract with Claude (streaming — callbacks drive state)
				analyzeContractWithStreaming(
					fullText,
					(event) => {
						if (event.type === "section") {
							setAnalysisResults((prev) => ({
								...prev,
								sections: [...prev.sections, event.section],
							}));
							setAnalysisProgress((prev) => ({
								sectionsReceived: prev.sectionsReceived + 1,
								currentSectionTitle: event.section.title,
							}));
						} else if (event.type === "complete") {
							setAnalysisResults((prev) => ({
								...prev,
								overallScore: event.overallScore,
								riskLevel: event.riskLevel,
								topConcerns: event.topConcerns,
								analysisId: crypto.randomUUID(),
							}));
							setStage("results");
						}
					},
					(errorMessage) => {
						console.error("Streaming analysis error:", errorMessage);
						alert(`Error: ${errorMessage}`);
						setStage("landing");
					},
				);
			} catch (error) {
				console.error("Error processing PDF:", error);
				alert(`Error: ${error.message}`);
				setStage("landing");
			}
		} else {
			alert("Please upload a PDF file");
		}
	};

	// Render all pages when PDF doc is loaded
	useEffect(() => {
		const renderPages = async () => {
			if (pdfDoc && stage === "results") {
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
			console.log("Selected text:", text);
		}
	};

	// Copy text to clipboard
	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		alert("Copied to clipboard!");
	};

	// Scroll to lawyer form
	const scrollToLawyerForm = () => {
		lawyerFormRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	// Handle form change
	const handleFormChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Handle form submit
	const handleFormSubmit = () => {
		if (
			!formData.fullName ||
			!formData.email ||
			!formData.contractType ||
			!formData.urgency ||
			!formData.briefDescription ||
			!formData.location ||
			!formData.preferredContact ||
			!formData.consentToContact
		) {
			alert("Please fill in all required fields");
			return;
		}
		console.log("Form submitted:", formData);
		alert("Thank you! A lawyer will contact you within 1-2 business days.");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{stage === "landing" && <LandingPage onFileUpload={handleFileUpload} />}

			{stage === "processing" && (
				<ProcessingScreen progress={analysisProgress} />
			)}

			{stage === "results" && (
				<ResultsView
					renderedPages={renderedPages}
					selectedText={selectedText}
					analysisResults={analysisResults}
					onTextSelection={handleTextSelection}
					onCopyText={copyToClipboard}
					onConsultLawyer={scrollToLawyerForm}
					lawyerFormRef={lawyerFormRef}
					formData={formData}
					onFormChange={handleFormChange}
					onFormSubmit={handleFormSubmit}
				/>
			)}
		</div>
	);
};

export default ContractAnalyzer;
