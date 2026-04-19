import { Brain, Loader2 } from "lucide-react";
import React from "react";

const ProcessingScreen = ({ progress }) => {
	const isAnalyzing = progress.sectionsReceived > 0;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
			<div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full">
				<div className="flex flex-col items-center">
					<div className="relative mb-6">
						<Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
						{isAnalyzing && (
							<Brain className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
						)}
					</div>

					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{isAnalyzing ? "Analyzing Your Contract" : "Processing PDF"}
					</h2>

					<p className="text-gray-600 text-center mb-6">
						{isAnalyzing
							? "Simplifying legal language and identifying red flags..."
							: "Extracting text from your document..."}
					</p>

					{isAnalyzing && (
						<div className="text-center space-y-2">
							<p className="text-sm font-medium text-indigo-700">
								{progress.sectionsReceived} section
								{progress.sectionsReceived !== 1 ? "s" : ""} analyzed so far
							</p>
							{progress.currentSectionTitle && (
								<p className="text-xs text-gray-500">
									Currently analyzing: {progress.currentSectionTitle}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProcessingScreen;
