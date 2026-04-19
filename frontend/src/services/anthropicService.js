const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Streams a full-document contract analysis from the backend.
 * @param {string} contractText - Complete extracted text of the contract
 * @param {(event: SectionEvent | CompleteEvent) => void} onProgress - Called for each parsed NDJSON line
 * @param {(message: string) => void} onError - Called on network or parse failure
 *
 * SectionEvent: { type: 'section', section: { title, summary, redFlags, score } }
 * CompleteEvent: { type: 'complete', overallScore, riskLevel, topConcerns }
 */
export const analyzeContractWithStreaming = async (
	contractText,
	onProgress,
	onError,
) => {
	try {
		const response = await fetch(`${BACKEND_URL}/api/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ contractText }),
		});

		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ error: response.statusText }));
			onError(errorData.error || response.statusText);
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				try {
					const obj = JSON.parse(trimmed);
					if (obj.error) {
						onError(obj.error);
						return;
					}
					if (obj.section) {
						onProgress({ type: "section", section: obj.section });
					} else if (obj.overallScore !== undefined) {
						onProgress({
							type: "complete",
							overallScore: obj.overallScore,
							riskLevel: obj.riskLevel,
							topConcerns: obj.topConcerns,
						});
					}
				} catch {
					// Silently skip lines that fail JSON.parse
				}
			}
		}

		const remaining = buffer.trim();
		if (remaining) {
			try {
				const obj = JSON.parse(remaining);
				if (obj.error) {
					onError(obj.error);
				} else if (obj.section) {
					onProgress({ type: "section", section: obj.section });
				} else if (obj.overallScore !== undefined) {
					onProgress({
						type: "complete",
						overallScore: obj.overallScore,
						riskLevel: obj.riskLevel,
						topConcerns: obj.topConcerns,
					});
				}
			} catch {
				// Skip invalid remaining buffer
			}
		}
	} catch (error) {
		onError(error.message);
	}
};
