import { ChevronRight, Scale } from "lucide-react";
import React from "react";

const LawyerForm = ({ formData, onChange, onSubmit, formRef }) => {
	return (
		<div ref={formRef} className="bg-white border-t mt-8 py-12">
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
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Contact Information
						</h3>
						<div className="space-y-4">
							<input
								type="text"
								placeholder="Full Name *"
								value={formData.fullName}
								onChange={(e) => onChange("fullName", e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
							/>
							<div className="grid grid-cols-2 gap-4">
								<input
									type="email"
									placeholder="Email *"
									value={formData.email}
									onChange={(e) => onChange("email", e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
								/>
								<input
									type="tel"
									placeholder="Phone Number"
									value={formData.phoneNumber}
									onChange={(e) => onChange("phoneNumber", e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
							<input
								type="text"
								placeholder="Location in BC *"
								value={formData.location}
								onChange={(e) => onChange("location", e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
					</div>

					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Your Situation
						</h3>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<select
									value={formData.contractType}
									onChange={(e) => onChange("contractType", e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
								>
									<option value="">Contract Type *</option>
									<option value="new-offer">New Job Offer</option>
									<option value="existing">Existing Employment</option>
									<option value="termination">Termination/Severance</option>
									<option value="contractor">Contractor Agreement</option>
								</select>
								<select
									value={formData.urgency}
									onChange={(e) => onChange("urgency", e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
								onChange={(e) => onChange("employmentSector", e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
								onChange={(e) => onChange("briefDescription", e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
							/>
							<select
								value={formData.preferredContact}
								onChange={(e) => onChange("preferredContact", e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
							onChange={(e) => onChange("consentToContact", e.target.checked)}
							className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
						/>
						<span className="text-sm text-gray-700">
							I consent to be contacted by an employment lawyer regarding my
							inquiry. *
						</span>
					</label>

					<button
						onClick={onSubmit}
						className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
					>
						Submit Request
						<ChevronRight className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default LawyerForm;
