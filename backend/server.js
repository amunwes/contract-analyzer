// server.js - Run this with: node server.js

import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import db from "./db/index.js";

dotenv.config({ path: '.env.local' });

db.raw('SELECT 1')
  .then(() => console.log('Database connection established'))
  .catch((err) => console.warn('Database not initialized — run npm run db:init:', err.message));

const app = express();
const PORT = 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY, // Note: no VITE_ prefix for backend
});

app.use(cors());
app.use(express.json());

// Analyze contract section endpoint
app.post("/api/analyze", async (req, res) => {
	try {
		const { sectionText, sectionNumber } = req.body;

		const prompt = `You are a legal document simplification assistant. Your job is to help everyday people understand employment contracts.

Analyze the following section from an employment contract:

---
${sectionText}
---

Please provide:

1. SIMPLIFIED SUMMARY: Rewrite this section in simple language that a grade-schooler could understand. Use everyday words and short sentences. Explain what this means for the employee in practical terms.

2. POTENTIAL RED FLAGS: List any clauses, terms, or phrasings that could be problematic or unfair to the employee. For each red flag, briefly explain why it might be concerning and suggest they consult a lawyer about it.

Format your response EXACTLY like this:

SIMPLIFIED SUMMARY:
[Your simplified explanation here]

RED FLAGS:
- [Red flag 1 with brief explanation]
- [Red flag 2 with brief explanation]
(Or write "None identified" if there are no concerning items)`;

		const message = await anthropic.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 2048,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
		});

		const analysisText = message.content[0].text;

		// Parse the response
		const simplifiedMatch = analysisText.match(
			/SIMPLIFIED SUMMARY:\s*([\s\S]*?)(?=RED FLAGS:|$)/i,
		);
		const redFlagsMatch = analysisText.match(/RED FLAGS:\s*([\s\S]*?)$/i);

		const simplified = simplifiedMatch
			? simplifiedMatch[1].trim()
			: "Unable to generate summary";

		let redFlags = [];
		if (redFlagsMatch) {
			const redFlagsText = redFlagsMatch[1].trim();
			if (redFlagsText.toLowerCase().includes("none identified")) {
				redFlags = [];
			} else {
				redFlags = redFlagsText
					.split(/\n[-•]\s*/)
					.map((flag) => flag.trim())
					.filter((flag) => flag.length > 0);
			}
		}

		res.json({
			sectionNumber,
			simplified,
			redFlags,
		});
	} catch (error) {
		console.error("Error analyzing section:", error);
		res.status(500).json({
			error: error.message,
			sectionNumber: req.body.sectionNumber,
			simplified: "Error analyzing this section",
			redFlags: [],
		});
	}
});

app.listen(PORT, () => {
	console.log(`Backend server running on http://localhost:${PORT}`);
});
