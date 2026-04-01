import { AlertTriangle, CheckCircle, Scale, Upload } from "lucide-react";
import React from "react";

const LandingPage = ({ onFileUpload }) => {
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
								This tool provides information to help you understand your
								employment contract, but it is not legal advice.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-lg p-8 mb-6">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">
						Upload Your Employment Contract
					</h2>
					<p className="text-gray-600 mb-6">
						Upload your PDF and highlight text to review it in the sidebar.
					</p>

					<label className="block">
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 cursor-pointer transition-colors">
							<input
								type="file"
								accept=".pdf"
								onChange={onFileUpload}
								className="hidden"
							/>
							<Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-lg font-medium text-gray-700 mb-2">
								Click to upload your contract
							</p>
							<p className="text-sm text-gray-500">PDF only (Max 10MB)</p>
						</div>
					</label>
				</div>

				<div className="bg-white rounded-xl shadow-lg p-6">
					<h3 className="font-semibold text-gray-900 mb-3">
						What We'll Review:
					</h3>
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
};

export default LandingPage;
