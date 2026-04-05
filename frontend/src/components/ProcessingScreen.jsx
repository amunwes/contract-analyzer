import { Brain, FileText, Loader2 } from "lucide-react";
import React from "react";

const ProcessingScreen = ({ progress, totalPages }) => {
	const isAnalyzing = progress.current > 0;
	const percentComplete =
		progress.total > 0
			? Math.round((progress.current / progress.total) * 100)
			: 0;

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
							? `Simplifying legal language and identifying red flags...`
							: "Extracting text from your document..."}
					</p>

					{isAnalyzing && (
						<>
							<div className="w-full bg-gray-200 rounded-full h-3 mb-3">
								<div
									className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
									style={{ width: `${percentComplete}%` }}
								/>
							</div>

							<p className="text-sm text-gray-600 mb-4">
								Analyzing page {progress.current} of {progress.total}
							</p>
						</>
					)}

					<div className="flex items-center gap-2 text-sm text-gray-500">
						<FileText className="w-4 h-4" />
						<span>
							{totalPages} page{totalPages !== 1 ? "s" : ""} detected
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProcessingScreen;
