import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const buildPrompt = (contractText) =>
	`You are an expert employment attorney analyzing contracts for everyday people.

Analyze the employment contract below. Identify all semantic sections (e.g. Compensation, Non-Compete, Termination, IP Assignment, Benefits, Confidentiality, Dispute Resolution, etc.).

For EACH section, output exactly one line of JSON with this shape (no other text):
{"section":{"title":"<section name>","summary":"<1-2 sentences, plain language, 8th-grade reading level>","redFlags":["<flag>"],"score":<0-100>}}

After all section lines, output one final line:
{"overallScore":<number>,"riskLevel":"<low|moderate|high>","topConcerns":["<concern 1>","<concern 2>","<concern 3>"]}

SCORING RUBRIC:
- Per section: 0-100 (100 = no concerns; deduct: high severity red flag = -30, medium = -15, low = -5; minimum 0)
- Overall score = weighted average: Non-Compete = 3x weight, IP Assignment = 3x, Termination = 2x, all others = 1x
- riskLevel: "low" if overallScore > 70, "moderate" if 40-70, "high" if < 40

OUTPUT RULES:
- Output ONLY lines of JSON. Zero prose, zero markdown, zero explanations.
- Every section object before the final overallScore object.
- Each object on its own newline.

CONTRACT:
${contractText}`;

export const analyzeHandler = async (req, res) => {
	const { contractText } = req.body;

	if (!contractText || typeof contractText !== 'string') {
		return res.status(400).json({ error: 'contractText is required and must be a string' });
	}

	res.setHeader('Content-Type', 'application/x-ndjson');
	res.setHeader('Transfer-Encoding', 'chunked');
	res.setHeader('Cache-Control', 'no-cache');
	res.flushHeaders();

	let buffer = '';

	try {
		const stream = anthropic.messages.stream({
			model: 'claude-sonnet-4-6',
			max_tokens: 4096,
			messages: [
				{
					role: 'user',
					content: buildPrompt(contractText),
				},
			],
		});

		for await (const event of stream) {
			if (
				event.type === 'content_block_delta' &&
				event.delta?.type === 'text_delta'
			) {
				buffer += event.delta.text;
				const lines = buffer.split('\n');
				buffer = lines.pop();

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed) continue;
					try {
						JSON.parse(trimmed);
						res.write(trimmed + '\n');
					} catch {
						// Skip invalid JSON lines
					}
				}
			}
		}

		const remaining = buffer.trim();
		if (remaining) {
			try {
				JSON.parse(remaining);
				res.write(remaining + '\n');
			} catch {
				// Skip invalid remaining buffer
			}
		}

		res.end();
	} catch (error) {
		if (!res.headersSent) {
			res.status(500).json({ error: error.message });
		} else {
			res.write(JSON.stringify({ error: error.message }) + '\n');
			res.end();
		}
	}
};
