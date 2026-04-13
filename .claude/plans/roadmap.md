# Contract Analyzer — Complete Product & Technical Roadmap

## Context & Product Strategy

**Vision:** Public, free contract analysis tool that generates qualified leads for law firms (pay-per-lead model). Positioning: "Access to justice + better informed clients."

**Deployment:** Build locally now, deploy post-MVP to $0-50/mo bootstrap-friendly infrastructure (Vercel/Railway/Render + Postgres, or similar).

**Revenue model interim:** Collect leads in Postgres DB, follow up with law firm partnerships. Feedback system tracks analysis quality.

**Incubator demo:** MVP shows complete funnel (upload → analysis → feedback → lead capture).

**Key architectural principle:** Full-document analysis with streaming. Claude reads entire contract at once (maintaining context across all sections), streams back structured analysis results so frontend can display progressively.

---

## Current State (Baseline)

**What exists today:**
- Frontend (React/Vite/TypeScript): PDF upload → page-by-page text extraction → results view with PDF viewer + sidebar
- Backend (Express): Single `/api/analyze` endpoint that processes one section at a time
- Frontend service: `anthropicService.js` orchestrates N sequential API calls, one per page
- UI feedback: Thumbs up/down + comment box in sidebar (not wired to backend)
- Lawyer form: Collects name, email, phone, sector, urgency, description, location, contact preference (goes nowhere)

**What needs to change:** Consolidate these into a lead-gen funnel with full-document context, streaming, and data persistence.

---

## GitHub Issues — Detailed Breakdown

Each issue below is ready to be converted into a GitHub issue. Each includes acceptance criteria, specific file changes, testing instructions, and dependency tracking.

---

### FOUNDATION LAYER

#### **Issue 1: Database Setup & Migrations**
**Branch:** `feature/issue-1-database-setup`
**Depends on:** Nothing
**Owner:** Backend
**Effort:** 2–4 hours
**Category:** Infrastructure

**Problem statement:**
Currently, we have no persistence layer. Lawyer inquiries and user feedback go nowhere. We need a local database for development and a migration system that can reliably version-control schema changes.

**Scope:**
Set up a relational database (SQLite for local dev, will migrate to Postgres on deployment) with a migration system. Create tables for lawyer inquiries and feedback. Ensure migrations can be run, rolled back, and tracked in git.

**Acceptance Criteria:**
- ✅ Database (SQLite) created and runs on `npm run db:init`
- ✅ Migration system installed and working (e.g., knex or similar)
- ✅ `migrations/` folder exists in `backend/` with at least one example migration
- ✅ `npm run db:migrate` applies migrations
- ✅ `npm run db:rollback` reverts migrations
- ✅ Two tables created: `lawyer_inquiries` and `feedback` (see schema below)
- ✅ `.env.local` template includes `DATABASE_URL` placeholder
- ✅ `backend/.gitignore` excludes `.db` files and `.env.local`
- ✅ README or inline script documents how to set up DB locally

**Implementation Details:**

Install `knex` and `sqlite3` (or chosen DB library) in `backend/package.json`:
```bash
npm install knex sqlite3 uuid
```

Create `backend/db/knexfile.js` (migration config):
```javascript
// Standard knex config, sqlite dev database
module.exports = {
  development: {
    client: 'sqlite3',
    connection: { filename: './data/contract_analyzer.db' },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' }
  }
};
```

Create `backend/db/migrations/001_create_initial_tables.js`:
```javascript
// Migration file with lawyer_inquiries and feedback table schemas (see schema section below)
```

Add scripts to `backend/package.json`:
```json
{
  "scripts": {
    "db:init": "knex migrate:latest --env development",
    "db:rollback": "knex migrate:rollback --env development",
    "db:seed": "knex seed:run --env development"
  }
}
```

**Key Files to Create/Modify:**
- `backend/package.json` — add knex, sqlite3 dependencies + scripts
- `backend/db/knexfile.js` — new, migration config
- `backend/db/migrations/001_create_initial_tables.js` — new, creates `lawyer_inquiries` and `feedback` tables
- `backend/.env.local` — template (add to `.gitignore`)
- `backend/.gitignore` — add `*.db`, `.env.local`, `data/`
- `backend/db/queries.js` — new, export query helpers for later issues

**Database Schema:**

```sql
-- lawyer_inquiries table
-- Stores form submissions from users who want to connect with lawyers
CREATE TABLE lawyer_inquiries (
  id TEXT PRIMARY KEY,                           -- UUID
  analysis_id TEXT,                              -- Links to the analysis that prompted this inquiry
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  sector VARCHAR(100),                           -- e.g. 'tech', 'manufacturing', 'healthcare'
  contact_preference VARCHAR(50),                -- 'email' or 'phone'
  additional_info TEXT,                          -- User's freeform additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- feedback table
-- Stores user feedback on analysis quality (thumbs up/down + comment)
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,                           -- UUID
  analysis_id TEXT,                              -- Links to the full analysis
  section_index INT,                             -- Which section (0, 1, 2, etc.)
  helpful BOOLEAN,                               -- true = thumbs up, false = thumbs down
  comment TEXT,                                  -- Optional user comment
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Testing Instructions:**
1. Delete any existing `backend/data/contract_analyzer.db`
2. Run `npm run db:init` from `backend/` directory
3. Verify `backend/data/contract_analyzer.db` was created
4. Connect to DB with SQLite CLI: `sqlite3 backend/data/contract_analyzer.db`
5. List tables: `.tables` — should see `lawyer_inquiries`, `feedback`
6. Run `npm run db:rollback` and verify tables are dropped
7. Run `npm run db:migrate` again and verify tables are recreated

**Potential Gotchas:**
- SQLite file path must be writable; `data/` directory may not exist after git clone
- UUID generation: `uuid` npm package handles client-side UUID creation
- Both tables should have indexes on `analysis_id` for faster queries in later issues

**Done Definition:**
Database is initialized, migrations are tracked in git, schema is correct, and the next agent can proceed to Issue 2.

---

#### **Issue 2: Backend — Full-Document Analysis with Streaming**
**Branch:** `feature/issue-2-full-doc-streaming-endpoint`
**Depends on:** Issue 1
**Owner:** Backend
**Effort:** 4–6 hours
**Category:** Core API

**Problem statement:**
Current backend processes contracts page-by-page, which loses context and makes Claude analyze each section in isolation. We need to send the entire contract at once so Claude understands cross-section relationships (e.g., a termination clause that conflicts with compensation terms). We also need streaming so the frontend gets results progressively instead of waiting 20+ seconds for the full response.

**Scope:**
Rewrite `backend/server.js` `/api/analyze` endpoint to:
1. Accept full contract text (not per-section)
2. Use Claude Streaming API to stream back analysis results
3. Query Claude once, providing full document context
4. Return newline-delimited JSON with semantic sections as they're analyzed
5. Include per-section scores and an overall contract score

**Acceptance Criteria:**
- ✅ `POST /api/analyze` accepts JSON body: `{ contractText: string }`
- ✅ Endpoint uses `stream: true` in Anthropic SDK
- ✅ Returns newline-delimited JSON (one JSON object per line)
- ✅ Each section object: `{ section: { title, summary, redFlags, score } }`
- ✅ Final chunk includes: `{ overallScore, riskLevel, topConcerns }`
- ✅ Sections are identified semantically (e.g. "Compensation", "Termination", "IP Assignment"), not by page
- ✅ Scoring is implemented per rubric (see below)
- ✅ `riskLevel` is one of: "low" (>70), "moderate" (40–70), "high" (<40)
- ✅ Handles streaming errors gracefully (returns error JSON on stream failure)
- ✅ No breaking changes to existing routes
- ✅ All console.log debugging removed before PR

**Implementation Details:**

The Claude prompt should instruct the model to:
1. Identify semantic sections of the contract
2. Analyze each section with full-document context
3. Score each section and the overall contract
4. Alert on cross-section red flags (e.g., termination clause conflicts)

**Scoring Rubric (implement in prompt — Claude does the calculation):**
- Per-section score: 0–100 (100 = no concerns, safe terms)
- Red flag deduction:
  - High severity: −30 points (e.g., non-compete with no geographic limit)
  - Medium severity: −15 points (e.g., ambiguous language in key clause)
  - Low severity: −5 points (e.g., missing formal definitions)
- Section weights for overall score:
  - Non-compete: 3x weight
  - IP Assignment: 3x weight
  - Termination: 2x weight
  - All other sections: 1x weight
- Overall score = weighted average of section scores
- Risk level: "low" if >70, "moderate" if 40–70, "high" if <40

**Key Files to Modify:**
- `backend/server.js` — rewrite `/api/analyze` endpoint to use streaming
- Create `backend/routes/analyze.js` — extract endpoint logic here (keep `server.js` thin)
- Update `backend/.env.local` — ensure `ANTHROPIC_API_KEY` is set

**Example Response Stream:**
```
{"section":{"title":"Compensation","summary":"Base salary of $150k/year with annual bonus eligibility...","redFlags":["Bonus criteria undefined - could be withheld arbitrarily"],"score":78}}
{"section":{"title":"Non-Compete","summary":"18-month non-compete with geographic restriction to USA...","redFlags":["Overly broad geographic scope could be unenforceable","No specified consideration beyond at-will employment"],"score":45}}
{"section":{"title":"IP Assignment","summary":"All work product created during employment assigned to company...","redFlags":["Includes IP created on personal time with personal equipment","No exemption for prior work or side projects"],"score":38}}
{"overallScore":54,"riskLevel":"moderate","topConcerns":["IP Assignment: Unusually broad - covers personal projects","Non-Compete: May be unenforceable; clarify geographic scope","Compensation: Bonus structure ambiguous"]}
```

**Prompt Template (pseudo-code, refine in implementation):**
```
You are an expert employment attorney analyzing contracts.

Analyze this contract and:
1. Identify all semantic sections (Compensation, Termination, IP, etc.)
2. For each section:
   - Write a 1-2 sentence plain-language summary (8th-grade reading level)
   - List any red flags (high/medium/low severity)
   - Score 0-100 using the rubric below
3. Provide 3 overall top concerns
4. Output as JSON per line (streaming) per attached schema

SCORING RUBRIC:
- Per-section: 0-100 (100 = safe, no concerns)
- Red flags deduct as follows:
  - High severity (dangerous/unenforceable): -30
  - Medium (ambiguous/one-sided): -15
  - Low (missing info/unclear): -5
- Floor is 0, ceiling is 100
- For overall score: calculate weighted average of all sections
  - Non-compete: 3x weight
  - IP Assignment: 3x weight
  - Termination: 2x weight
  - Other sections: 1x weight

OUTPUT FORMAT (newline-delimited JSON):
{"section":{"title":"<section name>","summary":"<2 sentences max, plain language>","redFlags":["<flag 1>","<flag 2>"],"score":<0-100>}}
... (repeat for each section)
{"overallScore":<weighted average>,"riskLevel":"<low|moderate|high>","topConcerns":["<concern 1>","<concern 2>","<concern 3>"]}

CONTRACT TEXT:
[CONTRACT HERE]
```

**Testing Instructions:**
1. Start backend: `npm run dev` from `backend/`
2. Use curl or Postman to test streaming:
   ```bash
   curl -X POST http://localhost:3001/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"contractText":"[sample contract text]"}' \
     --no-buffer
   ```
3. Verify output is newline-delimited JSON, not bulk response
4. Verify sections appear one-by-one (not all at end)
5. Test with real employment contract from frontend (separate PR after Issue 3)
6. Verify scoring: high-risk sections score <40, low-risk >70
7. Test error case: send invalid JSON, verify 400 response

**Potential Gotchas:**
- Streaming requires `--no-buffer` in curl to see line-by-line output
- JSON must be valid per line; a single malformed line breaks parsing on client
- Claude may not always output sections in the order you expect; frontend must not rely on order
- The prompt must be very explicit about JSON format; ambiguity leads to malformed output
- Cost: Full contract analysis costs ~$0.10–0.30 per call (fine for MVP)

**Done Definition:**
Endpoint accepts full contract text, streams semantic sections with scores, overall score calculation is correct, and frontend agent can integrate in Issue 3.

---

### Core UX Layer (Depends on Issue 2)

#### **Issue 3: Frontend — Stream Parsing & Progressive Display**
**Branch:** `feature/issue-3-stream-parsing`
**Depends on:** Issue 2
**Owner:** Frontend
**Effort:** 4–5 hours
**Category:** Core UX

**Problem statement:**
Currently, `anthropicService.js` makes N sequential calls per page, which is slow and loses context. We need to consume the streaming response from Issue 2 and progressively display sections to the user in real-time as they arrive.

**Scope:**
1. Rewrite `analyzeContractWithStreaming()` in `anthropicService.js` to use fetch with `response.body.getReader()`
2. Parse newline-delimited JSON from the streaming response
3. Extract section objects and the final overall score object
4. Call a progress callback to update UI in real-time
5. Remove old `analyzeEntireContract()` and page-splitting logic
6. Update `ProcessingScreen.jsx` to show per-section progress
7. Update `index.jsx` state to accumulate sections as they arrive

**Acceptance Criteria:**
- ✅ Remove: `analyzeEntireContract()` function, page-splitting logic in `anthropicService.js`
- ✅ Add: `analyzeContractWithStreaming(contractText, onProgress, onError)` function
- ✅ Function correctly parses newline-delimited JSON streaming response
- ✅ Sections are appended to state as they're received (not waiting for full response)
- ✅ `ProcessingScreen` shows progress: "Analyzing section 3 of 5: IP Assignment"
- ✅ On stream completion, automatically transition to `ResultsView`
- ✅ On stream error, show error state with retry button
- ✅ Feedback UI (thumbs up/down/comment) is visible in `AnalysisSidebar` (wired up in Issue 5)
- ✅ No `console.log` statements left in production code
- ✅ TypeScript types are correct (no implicit `any`)

**Key Files to Modify:**
- `frontend/src/services/anthropicService.js` — rewrite streaming logic
- `frontend/src/components/ProcessingScreen.jsx` — show section-level progress
- `frontend/src/components/index.jsx` — update state handling to append sections progressively
- `frontend/src/utils/pdfUtils.js` — remove page-splitting logic if present (keep PDF rendering)

**Implementation Details:**

**Streaming Parser Logic:**
```javascript
// Pseudo-code for frontend streaming parser
async function analyzeContractWithStreaming(contractText, onProgress, onError) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractText })
    });

    if (!response.ok) {
      onError(`Server error: ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sectionCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Process complete lines (last line may be incomplete)
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const obj = JSON.parse(line);
          if (obj.section) {
            sectionCount++;
            onProgress({
              type: 'section',
              section: obj.section,
              sectionIndex: sectionCount,
              totalSections: '???' // We don't know total upfront
            });
          } else if (obj.overallScore !== undefined) {
            onProgress({
              type: 'complete',
              overallScore: obj.overallScore,
              riskLevel: obj.riskLevel,
              topConcerns: obj.topConcerns
            });
          }
        } catch (e) {
          onError(`Failed to parse response: ${e.message}`);
        }
      }

      // Keep incomplete line in buffer for next iteration
      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    onError(`Network error: ${error.message}`);
  }
}
```

**State Updates in index.jsx:**
```javascript
// Current state structure should be:
const [analysisResults, setAnalysisResults] = useState({
  sections: [], // [ { title, summary, redFlags, score, sectionIndex }, ... ]
  overallScore: null,
  riskLevel: null,
  topConcerns: [],
  analysisId: null // Generate UUID for this analysis session
});

// When streaming section arrives:
const handleSectionReceived = (section, index) => {
  setAnalysisResults(prev => ({
    ...prev,
    sections: [...prev.sections, { ...section, sectionIndex: index }]
  }));
};

// When stream completes:
const handleStreamComplete = (overallScore, riskLevel, topConcerns) => {
  setAnalysisResults(prev => ({
    ...prev,
    overallScore,
    riskLevel,
    topConcerns,
    analysisId: generateUUID() // For linking to feedback/inquiries
  }));
  setStage('results');
};
```

**ProcessingScreen Updates:**
Show current section being analyzed (e.g. "Analyzing Non-Compete clause...") and progress percentage based on sections received.

**Removal Checklist:**
- Remove `analyzeEntireContract()` from `anthropicService.js`
- Remove page-splitting logic (e.g., split by `--- Page N ---`)
- Remove per-page loop structures
- Keep: PDF text extraction and PDF viewer rendering (those work fine)

**Testing Instructions:**
1. Start backend on port 3001 with Issue 2 implemented
2. Start frontend on port 5173
3. Upload a sample employment contract PDF
4. Watch `ProcessingScreen` show sections appearing one-by-one
5. Verify no delay between sections (streaming in real-time)
6. Check browser console for errors or network waterfalls
7. Verify `analysisResults` state has all sections with scores
8. Verify transition to `ResultsView` happens smoothly

**Potential Gotchas:**
- Streaming can timeout on slow networks; consider setting a longer timeout
- The final "complete" message may arrive a second after the last section
- Buffer handling is tricky: each `read()` chunk may contain partial JSON lines
- TypeScript: Make sure section and response types are properly typed

**Done Definition:**
Frontend consumes streaming response, displays sections progressively, and state is ready for Issue 4 (form prepopulation).

---

---

#### **Issue 4: Lawyer Form — Pre-populate from Analysis Results**
**Branch:** `feature/issue-4-form-prepopulation`
**Depends on:** Issue 3
**Owner:** Frontend
**Effort:** 2–3 hours
**Category:** UX Integration

**Problem statement:**
The lawyer form exists but is disconnected from the analysis results. Users have to re-describe their contract manually after already submitting it for analysis. We should auto-fill the form with the analysis summary and risk level so users just enter contact info.

**Scope:**
Wire `analysisResults` (from Issue 3) into `LawyerForm.jsx`. Auto-populate the description field with a generated summary of the analysis, risk level, and top concerns. Keep manual input fields for name, email, phone, and contact preference.

**Acceptance Criteria:**
- ✅ `LawyerForm` receives `analysisResults` as prop from `ResultsView`
- ✅ Form pre-fills `<textarea>` with: `"Overall Score: 72/100 (Moderate Risk)\nTop Concerns: NonCompete...\nIP..."`
- ✅ Form stays in `ResultsView` alongside `AnalysisSidebar` and PDF viewer
- ✅ Name, email, phone fields are empty (user fills these)
- ✅ Contact preference: radio buttons for "email" or "phone"
- ✅ "Connect with a lawyer" button submits to `/api/submit-inquiry` (wired in Issue 6)
- ✅ Form reads: `{ name, email, phone, analysisId, contactPreference }`
- ✅ Optional: sector field (single select or text input)
- ✅ No validation errors on form display (all fields optional except email/phone)

**Key Files to Modify:**
- `frontend/src/components/LawyerForm.jsx` — receive analysisResults, pre-fill textarea
- `frontend/src/components/ResultsView.jsx` — pass analysisResults to LawyerForm
- `frontend/src/components/AnalysisSidebar.jsx` — keep unchanged (feedback still present)

**Implementation Details:**

**Form Pre-population Logic:**
```javascript
// In LawyerForm.jsx
const generateSummary = (analysisResults) => {
  const { overallScore, riskLevel, topConcerns = [] } = analysisResults;
  return `Overall Score: ${overallScore}/100 (${riskLevel} Risk)\n\n` +
         `Top Concerns:\n${topConcerns.map(c => `• ${c}`).join('\n')}`;
};

// On component mount or when analysisResults change:
useEffect(() => {
  setFormData(prev => ({
    ...prev,
    analysisDescription: generateSummary(analysisResults)
  }));
}, [analysisResults]);
```

**Form Layout:**
```
[Pre-filled Analysis Summary] (read-only or light background)

[Name input]
[Email input]
[Phone input]
[Sector select] (optional)
[Contact Preference: ⭕ Email ⭕ Phone]
[Connect with a Lawyer button]
```

**Form State:**
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  sector: '',
  contactPreference: 'email',
  analysisDescription: '', // Pre-filled
  analysisId: analysisResults.analysisId // Hidden, passed to API
});
```

**Testing Instructions:**
1. From Issue 3, after sections stream and complete, `ResultsView` displays
2. Verify `LawyerForm` is visible at bottom of `ResultsView`
3. Verify analysis summary is pre-filled (read-only)
4. Manually fill name, email, phone
5. Select contact preference
6. Don't submit yet (Issue 6 handles submission)
7. Verify form data structure is correct

**Potential Gotchas:**
- Don't make analysisDescription editable; it should be read-only context
- Contact preference should default to "email"
- analysisId must be captured and passed in form submission

**Done Definition:**
Form is pre-populated with analysis summary, user can fill contact info, form is ready to submit in Issue 6.

---

---

#### **Issue 5: Feedback Persistence**
**Branch:** `feature/issue-5-feedback-persistence`
**Depends on:** Issue 1 (database)
**Owner:** Backend + Frontend
**Effort:** 3–4 hours
**Category:** Data Collection

**Problem statement:**
The feedback UI (thumbs up/down + comment) already exists in `AnalysisSidebar` but goes nowhere. We need to capture feedback and store it in the database so you can analyze which sections had helpful analyses and iterate on the prompt.

**Scope:**
1. **Backend:** Create `POST /api/feedback` endpoint that saves feedback to the `feedback` table
2. **Frontend:** Wire up the feedback buttons to call this endpoint, showing confirmation on success

**Acceptance Criteria:**

**Backend:**
- ✅ `POST /api/feedback` accepts: `{ analysisId: string, sectionIndex: number, helpful: boolean, comment?: string }`
- ✅ Endpoint validates: analysisId is UUID, sectionIndex >= 0, helpful is boolean
- ✅ Saves to `feedback` table with timestamp
- ✅ Returns: `{ success: true, message: "Thank you for your feedback" }`
- ✅ On error, returns: `{ success: false, message: "<error>" }` with appropriate HTTP status
- ✅ Uses database query from `db/queries.js`

**Frontend:**
- ✅ `AnalysisSidebar.jsx`: thumbs up/down buttons call `submitFeedback(sectionIndex, helpful, comment)`
- ✅ Show loading state while submitting (optional spinner)
- ✅ On success: show "Thanks for feedback" message for 2 seconds
- ✅ On error: show "Feedback failed. Try again?" (non-blocking, don't interrupt UX)
- ✅ Comment box is optional; empty comment is allowed
- ✅ Multiple feedback submissions per analysis are allowed (different sections)

**Key Files to Modify:**
- `backend/db/queries.js` — add `saveFeedback(analysisId, sectionIndex, helpful, comment)` function
- `backend/routes/feedback.js` — new, POST endpoint
- `backend/server.js` — add route: `app.post('/api/feedback', feedbackRoute)`
- `frontend/src/components/AnalysisSidebar.jsx` — add feedback submit handlers
- `frontend/src/services/anthropicService.js` — add `submitFeedback()` function that calls backend

**Implementation Details:**

**Backend Query Helper (db/queries.js):**
```javascript
const { v4: uuidv4 } = require('uuid');

async function saveFeedback(db, analysisId, sectionIndex, helpful, comment) {
  return db('feedback').insert({
    id: uuidv4(),
    analysis_id: analysisId,
    section_index: sectionIndex,
    helpful: helpful,
    comment: comment || null,
    created_at: new Date()
  });
}

module.exports = { saveFeedback };
```

**Backend Endpoint (routes/feedback.js):**
```javascript
const express = require('express');
const router = express.Router();
const { saveFeedback } = require('../db/queries');

router.post('/', async (req, res) => {
  const { analysisId, sectionIndex, helpful, comment } = req.body;

  // Validation
  if (!analysisId || sectionIndex === undefined || helpful === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    await saveFeedback(req.db, analysisId, sectionIndex, helpful, comment);
    res.json({ success: true, message: 'Thank you for your feedback' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Feedback submission failed' });
  }
});

module.exports = router;
```

**Frontend Service (anthropicService.js):**
```javascript
export async function submitFeedback(analysisId, sectionIndex, helpful, comment) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId, sectionIndex, helpful, comment })
    });
    if (!response.ok) throw new Error('Feedback failed');
    return await response.json();
  } catch (error) {
    throw new Error(`Feedback error: ${error.message}`);
  }
}
```

**Frontend Component (AnalysisSidebar.jsx - pseudo-code):**
```javascript
const [feedbackLoading, setFeedbackLoading] = useState({});
const [feedbackSuccess, setFeedbackSuccess] = useState({});

const handleFeedback = async (sectionIndex, helpful) => {
  setFeedbackLoading(prev => ({ ...prev, [sectionIndex]: true }));
  try {
    await submitFeedback(analysisResults.analysisId, sectionIndex, helpful);
    setFeedbackSuccess(prev => ({ ...prev, [sectionIndex]: true }));
    setTimeout(() =>
      setFeedbackSuccess(prev => ({ ...prev, [sectionIndex]: false })),
      2000
    );
  } catch (error) {
    // Show error silently or with toast
  } finally {
    setFeedbackLoading(prev => ({ ...prev, [sectionIndex]: false }));
  }
};

// For each section in sidebar:
<div>
  <button onClick={() => handleFeedback(sectionIndex, true)} disabled={feedbackLoading[sectionIndex]}>
    👍 Helpful
  </button>
  <button onClick={() => handleFeedback(sectionIndex, false)} disabled={feedbackLoading[sectionIndex]}>
    👎 Not helpful
  </button>
  {feedbackSuccess[sectionIndex] && <span>Thanks!</span>}
</div>
```

**Testing Instructions:**
1. After Issue 1 (database), create a test record in `lawyer_inquiries` to get a UUID for testing
2. In browser, click thumbs up on a section
3. Check backend logs for POST request
4. Query DB: `SELECT * FROM feedback WHERE analysis_id = '...'` — should see record
5. Click again on same section, verify another record is created
6. Try submitting with comment, verify comment is saved
7. Verify "Thanks for feedback" message appears briefly

**Potential Gotchas:**
- Comment field is optional; don't require it
- analysisId must be a valid UUID from `analysisResults`
- Multiple feedback per section is okay (user might change their mind)
- Feedback submission should never block the UI (non-blocking error handling)

**Done Definition:**
Feedback is captured and persisted to database. You can query feedback table to understand analysis quality.

---

### Lead Capture Layer

---

#### **Issue 6: Lawyer Form Submission & Lead Storage**
**Branch:** `feature/issue-6-lead-capture`
**Depends on:** Issue 4 (form pre-population)
**Owner:** Backend + Frontend
**Effort:** 3–4 hours
**Category:** Lead Generation

**Problem statement:**
The pre-populated lawyer form (Issue 4) still doesn't submit anywhere. We need an endpoint to receive form submissions and persist leads to the database so you can contact law firms and convert them to customers.

**Scope:**
1. **Backend:** Create `POST /api/submit-inquiry` endpoint that saves form data to `lawyer_inquiries` table
2. **Frontend:** Wire up form submit button to call endpoint, show confirmation message

**Acceptance Criteria:**

**Backend:**
- ✅ `POST /api/submit-inquiry` accepts: `{ name, email, phone, contactPreference, analysisId, sector?, additionalInfo? }`
- ✅ Validates: email is valid email, phone is 10+ digits, analysisId is UUID, contactPreference is 'email' or 'phone'
- ✅ Saves to `lawyer_inquiries` table with timestamps
- ✅ Returns: `{ success: true, message: "Thank you! We'll connect you with legal professionals within 48 hours." }`
- ✅ On validation error, returns 400: `{ success: false, message: "<specific error>" }`
- ✅ On database error, returns 500: `{ success: false, message: "Submission failed" }`

**Frontend:**
- ✅ `LawyerForm.jsx` submit button calls `POST /api/submit-inquiry` with form data
- ✅ On submit, set loading state (button becomes disabled, shows spinner)
- ✅ On success: show confirmation message ("Thank you! A legal professional will contact you soon")
- ✅ On success: provide "Start New Analysis" button to return to upload
- ✅ On error: show error message with retry button
- ✅ Form data includes `analysisId` (from `analysisResults`) in request body

**Key Files to Modify:**
- `backend/db/queries.js` — add `saveInquiry(name, email, phone, contactPreference, analysisId, sector, additionalInfo)` function
- `backend/routes/inquiries.js` — new, POST endpoint with validation
- `backend/server.js` — add route: `app.post('/api/submit-inquiry', inquiriesRoute)`
- `frontend/src/components/LawyerForm.jsx` — add submit handler
- `frontend/src/services/anthropicService.js` — add `submitInquiry()` function

**Implementation Details:**

**Backend Query Helper (db/queries.js):**
```javascript
const { v4: uuidv4 } = require('uuid');

async function saveInquiry(db, name, email, phone, contactPreference, analysisId, sector, additionalInfo) {
  return db('lawyer_inquiries').insert({
    id: uuidv4(),
    name,
    email,
    phone,
    contact_preference: contactPreference,
    analysis_id: analysisId,
    sector: sector || null,
    additional_info: additionalInfo || null,
    created_at: new Date(),
    updated_at: new Date()
  });
}

module.exports = { saveInquiry };
```

**Backend Endpoint (routes/inquiries.js):**
```javascript
const express = require('express');
const router = express.Router();
const { saveInquiry } = require('../db/queries');

// Validation helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10,}$/.test(phone.replace(/\D/g, ''));
const isValidUUID = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

router.post('/', async (req, res) => {
  const { name, email, phone, contactPreference, analysisId, sector, additionalInfo } = req.body;

  // Validation
  if (!name || !email || !phone || !contactPreference || !analysisId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number. Please use 10+ digits.' });
  }
  if (!['email', 'phone'].includes(contactPreference)) {
    return res.status(400).json({ success: false, message: 'Invalid contact preference' });
  }
  if (!isValidUUID(analysisId)) {
    return res.status(400).json({ success: false, message: 'Invalid analysis ID' });
  }

  try {
    await saveInquiry(req.db, name, email, phone, contactPreference, analysisId, sector, additionalInfo);
    res.json({
      success: true,
      message: 'Thank you! A legal professional will contact you within 48 hours.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Submission failed. Please try again.' });
  }
});

module.exports = router;
```

**Frontend Service (anthropicService.js):**
```javascript
export async function submitInquiry(inquiryData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/submit-inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    throw new Error(error.message || 'Submission failed');
  }
}
```

**Frontend Component (LawyerForm.jsx - pseudo-code):**
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitSuccess, setSubmitSuccess] = useState(false);
const [submitError, setSubmitError] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    await submitInquiry({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      contactPreference: formData.contactPreference,
      analysisId: analysisResults.analysisId,
      sector: formData.sector,
      additionalInfo: formData.additionalInfo
    });
    setSubmitSuccess(true);
  } catch (error) {
    setSubmitError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};

// Form JSX:
if (submitSuccess) {
  return (
    <div>
      <p>✅ Thank you! A legal professional will contact you within 48 hours.</p>
      <button onClick={() => window.location.reload()}>Start New Analysis</button>
    </div>
  );
}

// Regular form:
<form onSubmit={handleSubmit}>
  {/* Name, email, phone fields */}
  {submitError && <div className="error">{submitError}</div>}
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Submitting...' : 'Connect with a Lawyer'}
  </button>
</form>
```

**Testing Instructions:**
1. Fill in lawyer form with test data: name, email, phone, contact preference
2. Click "Connect with a Lawyer"
3. Check backend logs for POST request
4. Query DB: `SELECT * FROM lawyer_inquiries ORDER BY created_at DESC LIMIT 1` — should see new record
5. Verify success message displays
6. Check that form is replaced with "Start New Analysis" button
7. Test validation errors:
   - Invalid email: "Invalid email address"
   - Invalid phone (e.g., "123"): "Invalid phone number"
   - Missing field: "Missing required fields"
8. Verify confirmation message

**Potential Gotchas:**
- Phone validation should be flexible (accept with/without dashes, parentheses, spaces)
- Email validation should be basic but correct
- analysisId must come from `analysisResults` (generated in Issue 3)
- Sector is optional; don't require it
- On success, form should be replaced with confirmation (don't just show message over form)

**Done Definition:**
Form submissions are persisted to database. You can export leads and contact law firms to build partnerships.

---

### Polish & Safety Layer

---

#### **Issue 7: Rate Limiting**
**Branch:** `feature/issue-7-rate-limiting`
**Depends on:** Nothing (can run in parallel with Issues 1–6)
**Owner:** Backend
**Effort:** 1–2 hours
**Category:** Safety/Operations

**Problem statement:**
The `/api/analyze` endpoint is unauthenticated and could be abused, costing money on Claude API calls. We need rate limiting to prevent malicious users or automated attacks from draining your API budget.

**Scope:**
Add rate limiting middleware to `/api/analyze` only. Limit: 3 analyses per IP per hour. Return 429 with retry-after header on limit.

**Acceptance Criteria:**
- ✅ `npm install express-rate-limit` in backend
- ✅ Rate limit applied to `/api/analyze` endpoint only
- ✅ Limit: 3 requests per IP per hour
- ✅ Store: in-memory store (good for MVP; can upgrade to Redis later)
- ✅ Return 429 (Too Many Requests) when limit exceeded
- ✅ Response body: `{ error: "Rate limit exceeded. Try again in X minutes." }`
- ✅ Include `Retry-After` header with seconds until reset
- ✅ Other endpoints (feedback, inquiry) are NOT rate limited
- ✅ Localhost (127.0.0.1) is exempt from rate limiting (for local testing)

**Key Files to Modify:**
- `backend/package.json` — add `express-rate-limit` dependency
- `backend/middleware/rateLimit.js` — new, rate limit middleware config
- `backend/server.js` — import and apply middleware to `/api/analyze`

**Implementation Details:**

**Middleware (middleware/rateLimit.js):**
```javascript
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: 'Too many analyses. Please try again in an hour.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => req.ip === '127.0.0.1', // Skip rate limit for localhost
  keyGenerator: (req) => {
    // Use X-Forwarded-For for production (behind proxy)
    return req.headers['x-forwarded-for'] || req.ip;
  }
});
```

**Server.js Integration:**
```javascript
const analyzeRateLimit = require('./middleware/rateLimit');

app.post('/api/analyze', analyzeRateLimit, async (req, res) => {
  // ... existing endpoint logic
});
```

**Testing Instructions:**
1. Start backend: `npm run dev`
2. Make 3 POST requests to `/api/analyze` (with valid contract text) — should all succeed
3. Make 4th request — should return 429
4. Verify response body includes error message
5. Verify `Retry-After` header is present
6. Wait 1 hour (or clock forward in test) — limit resets
7. From localhost, all 4+ requests should succeed (exempt from limit)

**Potential Gotchas:**
- In-memory store doesn't persist across server restarts (fine for MVP)
- IP detection depends on proxy headers; test carefully in production
- Localhost exemption is good for local testing but remove before deploying to production (or keep for admin access)
- Rate limit windows are rolling (not fixed hour boundaries)

**Done Definition:**
Rate limiting is active on `/api/analyze`. Users can do 3 analyses/hour. You're protected from API key abuse.

---

---

#### **Issue 8: Error Handling & UX Polish**
**Branch:** `feature/issue-8-error-handling`
**Depends on:** Issue 3 (streaming infrastructure)
**Owner:** Frontend
**Effort:** 2–3 hours
**Category:** UX/Robustness

**Problem statement:**
Currently, when things go wrong (network errors, rate limit, malformed response), users see generic or unhelpful error messages. We need graceful error states that explain what happened and what to do next.

**Scope:**
Add comprehensive error handling throughout the analysis flow. Cover: stream parsing errors, network errors, rate limits (429), timeouts, large files.

**Acceptance Criteria:**
- ✅ Stream parse error → show "Analysis failed. Please check your file and try again." with retry button
- ✅ Network error (no connection) → show "Network error. Check your connection and try again."
- ✅ Rate limit (429) → show "You've used your 3 analyses this hour. Please try again later."
- ✅ Large file warning (>100 pages) → show "This document is large and may take several minutes to analyze."
- ✅ Timeout error (>60 seconds) → show "Analysis took too long. Please try again."
- ✅ HTTP error (500) → show "Server error. Please try again later."
- ✅ All error messages have a "Try Again" or "Start New Analysis" button
- ✅ Error states don't block the UI (can always return to landing page)
- ✅ No console.log or console.error in production code
- ✅ Errors are logged server-side (backend logs on 500 errors)

**Key Files to Modify:**
- `frontend/src/components/ProcessingScreen.jsx` — add error state display
- `frontend/src/components/index.jsx` — handle error states in main flow
- `frontend/src/services/anthropicService.js` — throw descriptive errors from streaming function
- `frontend/src/utils/pdfUtils.js` — add file size check before upload

**Implementation Details:**

**File Size Validation (pdfUtils.js):**
```javascript
export function checkFileSizeWarning(file) {
  const MB = file.size / (1024 * 1024);
  if (MB > 50) {
    return {
      warning: true,
      message: 'This document is large. Analysis may take several minutes.'
    };
  }
  return { warning: false };
}
```

**Error Handling in Streaming (anthropicService.js):**
```javascript
export async function analyzeContractWithStreaming(contractText, onProgress, onError) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractText }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      onError({
        type: 'RATE_LIMIT',
        message: 'You\'ve used your 3 analyses this hour. Try again later.'
      });
      return;
    }

    if (!response.ok) {
      onError({
        type: 'SERVER_ERROR',
        message: `Server error (${response.status}). Please try again.`
      });
      return;
    }

    // ... streaming parsing logic ...
    // Catch parse errors:
    try {
      const obj = JSON.parse(line);
      // process obj
    } catch (e) {
      onError({
        type: 'PARSE_ERROR',
        message: 'Analysis response was malformed. Please try again.'
      });
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      onError({
        type: 'TIMEOUT',
        message: 'Analysis took too long (>60 seconds). Please try again.'
      });
    } else if (!navigator.onLine) {
      onError({
        type: 'NETWORK_ERROR',
        message: 'No internet connection. Please check and try again.'
      });
    } else {
      onError({
        type: 'UNKNOWN_ERROR',
        message: error.message || 'An error occurred. Please try again.'
      });
    }
  }
}
```

**Error Display Component (ProcessingScreen.jsx):**
```javascript
if (stage === 'error') {
  const errorMessages = {
    RATE_LIMIT: 'You\'ve analyzed 3 contracts this hour. Please try again later.',
    SERVER_ERROR: 'The server encountered an error. Please try again.',
    NETWORK_ERROR: 'Network error. Check your connection and try again.',
    TIMEOUT: 'Analysis took too long. Please try again with a shorter document.',
    PARSE_ERROR: 'Analysis response was corrupted. Please try again.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again.'
  };

  return (
    <div className="error-container">
      <h2>⚠️ Analysis Failed</h2>
      <p>{errorMessages[error.type] || error.message}</p>
      <button onClick={handleRetry}>Try Again</button>
      <button onClick={() => setStage('landing')}>Start Over</button>
    </div>
  );
}
```

**Main Flow Error Handling (index.jsx):**
```javascript
const handleAnalysisError = (errorInfo) => {
  setError(errorInfo);
  setStage('error');
};

// Call this when starting analysis:
const handleAnalyzeDocument = async () => {
  const sizeCheck = checkFileSizeWarning(file);
  if (sizeCheck.warning) {
    // Show warning alert, let user confirm
    if (!confirm(sizeCheck.message + '\n\nContinue?')) return;
  }

  setStage('processing');
  await analyzeContractWithStreaming(
    contractText,
    handleProgress,
    handleAnalysisError
  );
};
```

**Testing Instructions:**
1. Test large file warning: upload PDF >50MB, verify warning appears
2. Test network error: simulate offline, try upload, verify error message
3. Test timeout: modify fetch to timeout after 1 second, verify "too long" error
4. Test rate limit: hit endpoint 4 times, verify 429 error message
5. Test malformed response: mock malformed JSON, verify parse error
6. Test server error: mock 500 response, verify "server error" message
7. From error state, test both "Try Again" and "Start Over" buttons
8. Verify no console errors in browser dev tools

**Potential Gotchas:**
- Timeout logic is tricky; test carefully across browsers and slow networks
- Rate limit message must match backend message
- File size check is rough (>50MB); refine based on actual contract sizes
- Don't block UX with error alerts; use dismissible messages or error state views
- Network error detection (`navigator.onLine`) isn't reliable; catch fetch errors instead

**Done Definition:**
All error paths have helpful, actionable messages. Users understand what went wrong and how to proceed.

---

---

#### **Issue 9: Session Persistence (Optional, Lower Priority)**
**Branch:** `feature/issue-9-session-persistence`
**Depends on:** Issue 3 (streaming, analysisResults)
**Owner:** Frontend
**Effort:** 2–3 hours
**Category:** UX Polish

**Problem statement:**
If a user refreshes the page after analysis, all results are lost. While not blocking MVP, persisting sessions to localStorage lets users share results or return later without re-uploading.

**Scope:**
Save analysis results to localStorage with a 1-hour TTL. On page load, restore if available. Provide a "Copy Link" feature to share results via URL.

**Acceptance Criteria:**
- ✅ After analysis completes, save full `analysisResults` object to localStorage key: `contractAnalysis_${analysisId}`
- ✅ On page load, check localStorage for analysis <1 hour old
- ✅ If found, skip upload and go directly to results
- ✅ Add "New Analysis" or "Clear Results" button to start fresh
- ✅ Add "Copy Shareable Link" button (base64 encode session and embed in URL)
- ✅ localStorage size limit: warn if trying to store >1MB
- ✅ Optional: Show "Last analysis from X minutes ago" when restoring

**Key Files to Modify:**
- `frontend/src/utils/storageUtils.js` — new, utilities for localStorage
- `frontend/src/components/index.jsx` — check/restore session on mount
- `frontend/src/components/ResultsView.jsx` — add "Copy Link" and "New Analysis" buttons

**Implementation Details:**

**Storage Utility (storageUtils.js):**
```javascript
const STORAGE_KEY_PREFIX = 'contractAnalysis_';
const TTL_HOURS = 1;

export function saveAnalysis(analysisId, analysisResults) {
  const data = {
    analysisResults,
    savedAt: Date.now()
  };
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${analysisId}`, JSON.stringify(data));
}

export function loadAnalysis(analysisId) {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${analysisId}`);
  if (!stored) return null;

  try {
    const { analysisResults, savedAt } = JSON.parse(stored);
    const ageHours = (Date.now() - savedAt) / (1000 * 60 * 60);
    if (ageHours > TTL_HOURS) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${analysisId}`);
      return null;
    }
    return analysisResults;
  } catch (e) {
    return null;
  }
}

export function clearAnalysis(analysisId) {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${analysisId}`);
}

export function generateShareLink(analysisId) {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${analysisId}`);
  if (!stored) return null;
  const encoded = btoa(stored); // Base64 encode
  return `${window.location.origin}?shared=${encoded}`;
}
```

**Testing Instructions:**
1. Complete an analysis (Issue 3)
2. Refresh page — verify results restore instantly
3. Verify "Last analysis from X minutes ago" message
4. Click "Copy Shareable Link," verify link is copied
5. Wait >1 hour, refresh — verify session is cleared (TTL expired)
6. Click "New Analysis," verify upload screen appears
7. Check localStorage in DevTools for saved data

**Potential Gotchas:**
- Base64 encoding is just obfuscation, not secure; don't store sensitive info
- localStorage has ~5-10MB limit per domain; check before saving
- URL parameters can get long; consider using URL shortener if sharing is popular
- Test across browsers (Safari has strict storage limits)

**Done Definition:**
Session persists across refresh. Users can share results and return later.

---

---

#### **Issue 10: PDF Extraction Quality (Optional)**
**Branch:** `feature/issue-10-pdf-extraction-polish`
**Depends on:** Nothing (independent)
**Owner:** Frontend
**Effort:** 2–4 hours
**Category:** Quality

**Problem statement:**
Basic PDF text extraction (current behavior) struggles with multi-column layouts, preserves awkward whitespace, and loses formatting hints (bold, italics, headers). Better extraction → better analysis → higher-quality results for users.

**Scope:**
Improve `pdfUtils.js` extraction to handle multi-column PDFs, preserve structural hints, and clean up extracted text. No new dependencies; use existing pdf.js capabilities.

**Acceptance Criteria:**
- ✅ Handle multi-column PDFs: detect columns and re-order text left-to-right, top-to-bottom
- ✅ Preserve section headers (often bold/larger font): mark as `### Header` instead of inline
- ✅ Clean whitespace: collapse multiple spaces, trim blank lines, normalize line breaks
- ✅ Preserve some formatting context: `[BOLD]text[/BOLD]` or similar markers for headers
- ✅ Log extraction stats (pages, total words, detected sections) for debugging
- ✅ Test on real employment contracts (5–20 pages)
- ✅ Verify no regression: existing extraction still works for single-column docs

**Key Files to Modify:**
- `frontend/src/utils/pdfUtils.js` — improve `extractTextFromPDF()` function
- No new dependencies; pdf.js already used for text content

**Implementation Ideas:**

**Column Detection:**
```javascript
// Rough heuristic: if text x-coordinates vary widely within a page,
// likely multi-column. Split and re-order.
function detectAndReorderColumns(textContent) {
  const items = textContent.items;
  const xPositions = items.map(item => item.transform[4]); // x coordinate
  const xRange = Math.max(...xPositions) - Math.min(...xPositions);

  if (xRange > 500) { // Arbitrary threshold, adjust based on tests
    // Multi-column: sort by y first (top-to-bottom), then x (left-to-right)
    items.sort((a, b) => {
      const yDiff = a.transform[5] - b.transform[5];
      if (Math.abs(yDiff) > 10) return yDiff; // Different rows
      return a.transform[4] - b.transform[4]; // Same row: left-to-right
    });
  }
  return items.map(item => item.str).join('');
}
```

**Header Preservation:**
```javascript
// Detect font size changes (headers are often 14+ pt, body is 10–12 pt)
function preserveHeaders(items) {
  let result = '';
  let lastFontSize = null;

  for (const item of items) {
    const currentFontSize = item.height; // Rough estimate

    // If font size jumps up, likely a header
    if (lastFontSize && currentFontSize > lastFontSize * 1.3) {
      result += `\n### ${item.str}\n`;
    } else {
      result += item.str;
    }
    lastFontSize = currentFontSize;
  }
  return result;
}
```

**Text Cleanup:**
```javascript
function cleanExtractedText(text) {
  return text
    .split('\n')
    .map(line => line.trim())                 // Trim whitespace
    .filter(line => line.length > 0)         // Remove blank lines
    .join('\n')
    .replace(/  +/g, ' ')                     // Collapse multiple spaces
    .replace(/\n\n+/g, '\n\n');               // Max 2 newlines
}
```

**Testing Instructions:**
1. Find 5 real employment contract PDFs (variety: single-column, multi-column, headers, etc.)
2. Extract text with improved `extractTextFromPDF()`
3. Manually review extracted text: is it readable? Are headers marked?
4. Send extracted text to Issue 2 backend for analysis
5. Verify Claude can identify sections correctly (don't need to analyze deeply, just check comprehension)
6. Compare with original extraction: is improvement noticeable?
7. Test edge cases: scanned PDFs, images, tables

**Potential Gotchas:**
- PDF structure varies wildly; no perfect solution (may need post-release tuning)
- Font size detection is rough (pdf.js gives dimensions, not actual point size)
- Column detection heuristic may fail on unusual layouts
- Over-aggressive text cleanup can remove intentional formatting

**Done Definition:**
Extraction is more robust. Multi-column PDFs and formatted contracts extract more clearly.

---

## Phasing & Delivery

### MVP Phase (Deploy-Ready)
**Issues 1–8:** Database setup, streaming analysis, form, feedback, lead capture, rate limiting, error handling.

**Timeline:** 2–3 weeks depending on team size.

**Definition of "Done":**
- ✅ Upload contract → full-doc analysis with streaming
- ✅ Sections display with scores
- ✅ Feedback thumbs up/down + comment persists
- ✅ User submits lawyer inquiry → saved to DB
- ✅ Rate limiting active
- ✅ All error states handled
- ✅ `npm run check` passes
- ✅ Local dev runs smoothly

### Post-MVP (Iterate with Real Users)
**Issues 9–10:** Session persistence, PDF extraction edge cases.

**Also:** Deploy to production (Postgres + backend + frontend on Vercel or railway.app).

---

## Architecture Notes for Implementation

### Backend Structure
```
backend/
├── server.js                 (entry point, routes)
├── middleware/
│   └── rateLimit.js         (from Issue 7)
├── db/
│   ├── migrations/          (from Issue 1)
│   └── queries.js           (lawyer_inquiries, feedback queries)
├── routes/
│   ├── analyze.js           (Issue 2: streaming endpoint)
│   ├── feedback.js          (Issue 5: feedback POST)
│   └── inquiries.js         (Issue 6: lead capture POST)
└── .env.local               (DATABASE_URL, ANTHROPIC_API_KEY)
```

### Frontend Structure
No major changes to file structure, but key updates:
- `services/anthropicService.js` — rewrite to stream parsing (Issue 3)
- `components/AnalysisSidebar.jsx` — add feedback submit handler (Issue 5)
- `components/LawyerForm.jsx` — pre-populate from analysis, submit to /api/submit-inquiry (Issues 4, 6)
- `components/ProcessingScreen.jsx` — show per-section progress (Issue 3)

### Database Schema (Issue 1)

```sql
-- lawyer_inquiries
CREATE TABLE lawyer_inquiries (
  id UUID PRIMARY KEY,
  analysis_id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  sector VARCHAR(100),
  contact_preference VARCHAR(50), -- 'email' | 'phone'
  additional_info TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  analysis_id UUID,
  section_index INT,
  helpful BOOLEAN,
  comment TEXT,
  created_at TIMESTAMP
);
```

---

## Verification / Testing

**Local dev verification:**
1. `npm install && npm run dev` in frontend/backend (should start on 5173 + 3001)
2. Upload a real employment contract PDF
3. Watch sections stream in real-time
4. See scores and red flags
5. Click feedback thumbs up/down, check DB for record
6. Submit lawyer form, check DB for lead entry
7. Hit rate limit, see error message
8. Refresh page, verify feedback/form data (once Issue 9 ships)

**Before opening PR:**
- `npm run check --prefix frontend` passes
- No console errors
- Database migrations run cleanly
- No commented-out code

---

## Deployment Considerations (Post-MVP)

**Cost-constrained setup (~$0-50/mo):**
- Frontend: Vercel free tier
- Backend + DB: Railway.app ($5-7/mo) or Render free tier
- Claude API: Budget ~$0.50-2 per analysis; sustainable with 50-100 analyses/month

**Environment:**
- Production `.env`: DATABASE_URL, ANTHROPIC_API_KEY, NODE_ENV=production
- Consider adding Claude API monitoring (usage alerts at $20/mo)
- Simple logging for errors (Sentry free tier optional)

**Lawyer outreach:**
- Once deployed, export leads from `lawyer_inquiries` table
- Send intro email to law firms: "Here's your first lead."
- Collect feedback on lead quality (helps you improve positioning)

---

## How the Next Agent Should Use This Plan

This document is the source of truth for all 10 GitHub issues. **Do not create issues directly from memory.** Instead:

### For Creating GitHub Issues:
1. **Read this file top-to-bottom** once to understand the full scope
2. **For each issue (1–10):**
   - Copy the section exactly (from `#### **Issue N:**` through `**Done Definition:**`)
   - Paste into GitHub issue body
   - Use the issue number in the branch name: `feature/issue-N-{slug}`
   - Label with category: `backend`, `frontend`, `infrastructure`, etc.
   - Add a `needs-triage` label for visibility
   - Link to related issues (dependencies)

### For Assigning Work:
- **Issues 1–8** are MVP blockers (required for deployment)
- **Issues 9–10** are post-MVP polish (nice-to-have)
- **Dependency chain:**
  - Issue 1 must complete before Issues 5, 6
  - Issue 2 must complete before Issue 3 (streaming depends on backend)
  - Issue 3 must complete before Issues 4, 8
  - Issue 4 must complete before Issue 6
  - Issues 7 can run in parallel (no dependencies)

### For Code Review:
Before approving any PR:
1. Verify the issue's "Acceptance Criteria" are all met
2. Verify the "Definition of Done" is satisfied
3. Run the "Testing Instructions" locally
4. Confirm: `npm run check --prefix frontend` passes (frontend only)
5. Check for: no console.log, no commented code, no `any` types without justification

### For the Lead Agent (if triggered):
If the `agent` label is added to a GitHub issue:
1. Read the issue body (copied from this plan)
2. Identify which backend/frontend agent owns it
3. Dispatch subagent with the issue details and relevant context from `.claude/agents/`
4. After completion, open PR using `.claude/commands/open-pr.md` format
5. Link PR to issue (`Closes #N`)

---

## MVP Completion Checklist

Use this to track progress toward deployment-ready code:

**Database & Core Data (Issues 1):**
- [ ] SQLite + knex migrations set up
- [ ] `lawyer_inquiries` and `feedback` tables created and reversible

**Streaming Analysis (Issues 2–3):**
- [ ] `/api/analyze` accepts full contract text
- [ ] Response streams newline-delimited JSON
- [ ] Frontend parses stream and displays sections progressively
- [ ] Sections are scored (0–100 per rubric)
- [ ] Overall score and risk level calculated

**Lead Capture Funnel (Issues 4–6):**
- [ ] Lawyer form pre-filled with analysis summary
- [ ] Form submission saves to `lawyer_inquiries` table
- [ ] User sees confirmation message

**Safety & Quality (Issues 7–8):**
- [ ] Rate limiting active: 3 analyses/IP/hour
- [ ] All error states have helpful messages
- [ ] Lint passes: `npm run check --prefix frontend`
- [ ] No console errors

**Data Collection (Issue 5):**
- [ ] Feedback (thumbs up/down + comment) saves to DB
- [ ] You can query feedback table to improve prompts

**Ready to Deploy:**
- [ ] All 8 issues complete
- [ ] All acceptance criteria met
- [ ] Database migrations tracked in git
- [ ] `.env.local` template exists
- [ ] README updated with local dev setup
- [ ] Tested locally: upload contract → streaming analysis → feedback + form submission → DB records created

---

## Quick Reference: Issue Priority & Timeline

| Phase | Issues | Timeline | Outcomes |
|-------|--------|----------|----------|
| **Foundation** | 1, 2 | 1–2 weeks | Database + streaming backend ready |
| **Core UX** | 3, 4, 7 | 1–2 weeks | Streaming frontend + form UX + rate limiting |
| **Lead Capture** | 5, 6 | 3–4 days | Feedback + form submissions persisted |
| **Polish** | 8 | 2–3 days | Error handling complete |
| **MVP Deploy Ready** | 1–8 | **2–3 weeks total** | Live app generation-ready |
| **Post-MVP** | 9, 10 | Async | Session persistence + PDF improvements |

---

## Key Decision Points for the Next Agent

If you encounter ambiguity, here are the answers:

**Q: Should I use Postgres or SQLite?**
A: SQLite for local dev (Issue 1). Postgres for production deployment (post-MVP). Migration is straightforward with knex.

**Q: How much should I invest in error handling?**
A: Issue 8 is non-negotiable before MVP deployment. Cover the major cases (stream error, network, timeout, rate limit, large file). Don't over-engineer.

**Q: Can I bundle issues together?**
A: No. One PR per issue, unless the issue description says "Backend + Frontend" (like Issues 5, 6). Keep PRs focused.

**Q: What if a dependency is blocked?**
A: Issues 1, 7 have no dependencies and can start immediately. Don't wait; parallelize. Issues 3, 8 depend on Issue 2 (streaming), so those unblock once Issue 2 is complete.

**Q: Do I need to write tests?**
A: No, not in MVP scope. Focus on correctness. If time permits post-MVP, add tests (especially for scoring logic, feedback persistence).

**Q: What's the single most important thing?**
A: **Issue 2** (streaming backend). Everything else depends on it. Get that right first, and the rest flows naturally.

---

## Files You'll Create or Heavily Modify

**Don't create these until assigned an issue — this is just a map:**

**Backend:**
- `db/knexfile.js` (Issue 1)
- `db/migrations/001_create_initial_tables.js` (Issue 1)
- `db/queries.js` (Issues 1, 5, 6)
- `routes/analyze.js` (Issue 2)
- `routes/feedback.js` (Issue 5)
- `routes/inquiries.js` (Issue 6)
- `middleware/rateLimit.js` (Issue 7)
- `server.js` (integration across issues)

**Frontend:**
- `services/anthropicService.js` (Issues 2, 3, 5, 6)
- `utils/pdfUtils.js` (Issue 10, optional)
- `utils/storageUtils.js` (Issue 9, optional)
- `components/index.jsx` (Issues 3, 4, 8)
- `components/ProcessingScreen.jsx` (Issues 3, 8)
- `components/AnalysisSidebar.jsx` (Issue 5)
- `components/LawyerForm.jsx` (Issues 4, 6)
- `components/ResultsView.jsx` (Issue 4)

---

## Final Notes

- **This plan is not set in stone.** If you discover a better approach during implementation, update this file and notify the team.
- **Test locally before PR.** Use the testing instructions in each issue.
- **Commit frequently.** Small, focused commits are easier to review.
- **No WIP PRs.** Each PR should be ready to merge (or rejected). If you need feedback mid-work, mention it in the PR description.
- **Ask questions early.** If an issue is unclear, raise it before coding, not after.

---

**Plan created:** 2026-04-09
**Target deployment:** 2–3 weeks from kickoff (Issues 1–8)
**MVP definition:** Issues 1–8 complete, fully tested, lint passing, deployed to production
