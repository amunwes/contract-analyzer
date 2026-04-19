import {
	AlertTriangle,
	BookOpen,
	ChevronDown,
	ChevronUp,
	Copy,
	ExternalLink,
	MessageSquare,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const AnalysisSidebar = ({
	analysisResults,
	selectedText,
	onCopyText,
	onConsultLawyer,
}) => {
	const {
		sections = [],
		overallScore,
		riskLevel,
		topConcerns = [],
	} = analysisResults;

	const [expandedSections, setExpandedSections] = useState({});
	const [feedback, setFeedback] = useState({});
	const [showCommentBox, setShowCommentBox] = useState({});
	const [_overallFeedback, _setOverallFeedback] = useState({
		rating: null,
		comment: "",
		submitted: false,
	});
	const [_showOverallComment, _setShowOverallComment] = useState(false);

	useEffect(() => {
		if (sections.length === 1) {
			setExpandedSections({ 0: true });
		}
	}, [sections.length]);

	const toggleSection = (index) => {
		setExpandedSections((prev) => ({ ...prev, [index]: !prev[index] }));
	};

	const handleFeedback = (sectionIndex, rating) => {
		setFeedback((prev) => ({
			...prev,
			[sectionIndex]: { ...prev[sectionIndex], rating },
		}));
	};

	const handleCommentSubmit = (sectionIndex) => {
		const comment = feedback[sectionIndex]?.comment;
		if (!comment?.trim()) return;

		setShowCommentBox((prev) => ({ ...prev, [sectionIndex]: false }));
		alert("Thank you for your feedback!");
	};

	const toggleCommentBox = (sectionIndex) => {
		setShowCommentBox((prev) => ({
			...prev,
			[sectionIndex]: !prev[sectionIndex],
		}));
	};

	const totalRedFlags = sections.reduce(
		(sum, section) => sum + (section.redFlags?.length || 0),
		0,
	);

	return (
		<div
			className="w-96 space-y-4 overflow-auto bg-gray-50 rounded-lg p-4"
			style={{ maxHeight: "85vh" }}
		>
			{/* Summary Card */}
			<div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
				<h3 className="font-semibold text-indigo-900 mb-2">
					Contract Analysis
				</h3>
				<div className="space-y-1 text-sm text-indigo-800">
					<p>
						📄 {sections.length} section{sections.length !== 1 ? "s" : ""}{" "}
						analyzed
					</p>
					<p className="flex items-center gap-1">
						<AlertTriangle className="w-4 h-4" />
						{totalRedFlags} potential red flag{totalRedFlags !== 1 ? "s" : ""}{" "}
						identified
					</p>
				</div>
			</div>

			{/* Overall Score Card */}
			{overallScore !== null && (
				<div className="bg-white border-2 border-gray-200 rounded-lg p-4">
					<h3 className="font-semibold text-gray-900 mb-3">
						Overall Assessment
					</h3>
					<div className="flex items-center gap-3 mb-3">
						<span
							className={`text-2xl font-bold ${
								riskLevel === "low"
									? "text-green-600"
									: riskLevel === "moderate"
										? "text-yellow-600"
										: "text-red-600"
							}`}
						>
							{overallScore}/100
						</span>
						<span
							className={`text-sm font-medium px-2 py-1 rounded-full ${
								riskLevel === "low"
									? "bg-green-100 text-green-800"
									: riskLevel === "moderate"
										? "bg-yellow-100 text-yellow-800"
										: "bg-red-100 text-red-800"
							}`}
						>
							{riskLevel
								? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)
								: ""}{" "}
							Risk
						</span>
					</div>
					{topConcerns.length > 0 && (
						<div>
							<p className="text-xs font-medium text-gray-600 mb-1">
								Top Concerns:
							</p>
							<ul className="space-y-1">
								{topConcerns.map((concern, i) => (
									<li
										key={i}
										className="text-xs text-gray-700 flex items-start gap-1"
									>
										<span className="text-orange-500 mt-0.5">•</span>
										{concern}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

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
				{sections.map((section, index) => (
					<div
						key={index}
						className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden"
					>
						{/* Section Header */}
						<button
							onClick={() => toggleSection(index)}
							className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
								<h3 className="font-semibold text-gray-900 text-left truncate">
									{section.title}
								</h3>
								{section.redFlags && section.redFlags.length > 0 && (
									<span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
										{section.redFlags.length} ⚠️
									</span>
								)}
								<span
									className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
										section.score > 70
											? "bg-green-100 text-green-800"
											: section.score >= 40
												? "bg-yellow-100 text-yellow-800"
												: "bg-red-100 text-red-800"
									}`}
								>
									{section.score}/100
								</span>
							</div>
							{expandedSections[index] === true ? (
								<ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
							) : (
								<ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
							)}
						</button>

						{/* Expanded Content */}
						{expandedSections[index] === true && (
							<div className="p-4 pt-0 space-y-4">
								{/* Summary */}
								<div>
									<h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
										<span className="text-blue-600">📖</span>
										Simple Explanation
									</h4>
									<p className="text-sm text-gray-700 leading-relaxed">
										{section.summary}
									</p>
								</div>

								{/* Red Flags */}
								{section.redFlags && section.redFlags.length > 0 && (
									<div>
										<h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
											<AlertTriangle className="w-4 h-4 text-red-600" />
											Potential Issues
										</h4>
										<ul className="space-y-2">
											{section.redFlags.map((flag, flagIndex) => (
												<li
													key={flagIndex}
													className="text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-400"
												>
													{flag}
												</li>
											))}
										</ul>
									</div>
								)}

								{/* Feedback Section */}
								<div className="border-t pt-3">
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs font-medium text-gray-600">
											Was this analysis helpful?
										</span>
										<div className="flex gap-2">
											<button
												onClick={() => handleFeedback(index, "up")}
												className={`p-1.5 rounded transition-colors ${
													feedback[index]?.rating === "up"
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
												}`}
												title="Helpful"
											>
												<ThumbsUp className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleFeedback(index, "down")}
												className={`p-1.5 rounded transition-colors ${
													feedback[index]?.rating === "down"
														? "bg-red-100 text-red-700"
														: "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
												}`}
												title="Not helpful"
											>
												<ThumbsDown className="w-4 h-4" />
											</button>
											<button
												onClick={() => toggleCommentBox(index)}
												className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
												title="Add comment"
											>
												<MessageSquare className="w-4 h-4" />
											</button>
										</div>
									</div>

									{/* Comment Box */}
									{showCommentBox[index] && (
										<div className="mt-2 space-y-2">
											<textarea
												value={feedback[index]?.comment || ""}
												onChange={(e) =>
													setFeedback((prev) => ({
														...prev,
														[index]: {
															...prev[index],
															comment: e.target.value,
														},
													}))
												}
												placeholder="Tell us more about your experience with this analysis..."
												className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
												rows={3}
											/>
											<div className="flex gap-2">
												<button
													onClick={() => handleCommentSubmit(index)}
													className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-indigo-700"
												>
													Submit Feedback
												</button>
												<button
													onClick={() => toggleCommentBox(index)}
													className="flex-1 bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded hover:bg-gray-300"
												>
													Cancel
												</button>
											</div>
										</div>
									)}

									{/* Feedback confirmation */}
									{feedback[index]?.rating && !showCommentBox[index] && (
										<p className="text-xs text-gray-500 mt-1">
											✓ Thank you for your feedback!
										</p>
									)}
								</div>
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
						We identified {totalRedFlags} potential issue
						{totalRedFlags !== 1 ? "s" : ""} that may need legal review.
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
