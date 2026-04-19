# Plan: Full-Document Analysis with Streaming

## Overview
Rewrite the contract analysis pipeline so the entire contract is sent to Claude in one call,
with results streamed back as newline-delimited JSON. This replaces the current N sequential
per-page API calls (slow, no cross-section context) with a single streaming call that produces
semantic sections progressively, each with a title, plain-language summary, red flags, and a
0-100 score, followed by an overall contract score and risk level.

## Success Criteria
- [ ] `POST /api/analyze` accepts `{ contractText: string }` and returns streaming NDJSON
- [ ] Each streamed section line is valid JSON: `{ "section": { "title", "summary", "redFlags", "score" } }`
- [ ] Final streamed line is valid JSON: `{ "overallScore", "riskLevel", "topConcerns" }`
- [ ] Frontend displays sections one-by-one as they arrive during the processing screen
- [ ] `ResultsView` renders using the new data shape (title/summary/score instead of sectionNumber/simplified)
- [ ] `AnalysisSidebar` shows an overall score card (overallScore, riskLevel, topConcerns)
- [ ] Feedback system still works (section-level thumbs up/down)
- [ ] Stream error in backend returns `{ "error": "..." }` NDJSON line; frontend shows error state + returns to landing
- [ ] No `console.log` statements in production paths
- [ ] Passes `npm run check --prefix frontend` with zero errors

## Affected Areas
- `backend/routes/analyze.js` — **new file**: streaming endpoint handler (created to keep `server.js` thin)
- `backend/server.js` — remove old `/api/analyze` stub, mount new route module
- `frontend/src/services/anthropicService.js` — replace `analyzeEntireContract` with `analyzeContractWithStreaming`
- `frontend/src/components/index.jsx` — new `analysisResults` state shape, streaming handler replaces sequential loop
- `frontend/src/components/ProcessingScreen.jsx` — section-count progress (unknown total) instead of page-count progress
- `frontend/src/components/AnalysisSidebar.jsx` — consume new data shape; add overall score card; fix `expandedSections` to work with dynamic section arrival

## Architecture Notes

### API Contract Change
Old: `POST /api/analyze` → `{ sectionText, sectionNumber }` → `{ sectionNumber, simplified, redFlags[] }`
New: `POST /api/analyze` → `{ contractText }` → streaming NDJSON (one JSON object per line)

This is a breaking change to the only API route. Both caller (frontend service) and handler
(backend route) are changed in the same PR, so no compatibility shim is needed.

### State Shape Change in `index.jsx`
Old `analysisResults`: `Array<{ sectionNumber, simplified, redFlags[], error? }>`

New `analysisResults`:
```js
{
  sections: Array<{ title: string, summary: string, redFlags: string[], score: number }>,
  overallScore: number | null,
  riskLevel: 'low' | 'moderate' | 'high' | null,
  topConcerns: string[],
  analysisId: string | null,   // crypto.randomUUID() assigned on stream complete
}
```

`ResultsView` receives the whole object and passes it unchanged to `AnalysisSidebar`. No
changes needed in `ResultsView` itself — the prop name stays `analysisResults`.

### `expandedSections` Fix in `AnalysisSidebar`
The current init `analysisResults.map((_, i) => i === 0)` produces an empty array when
sections haven't arrived yet. Change to an object: `{}`. Lookup becomes `expandedSections[i]`,
default `false`. Auto-expand the first section using a `useEffect` that fires when
`sections.length` goes from 0 to 1.

### Streaming Buffer Handling in Backend
Claude streams text deltas; each delta may be a partial JSON line. The backend accumulates
text in a string buffer, splits on `\n`, validates each complete line as JSON before writing
to `res`, and holds the last (incomplete) line in the buffer. On stream end, flush remaining
buffer if it forms valid JSON.

### Scoring Rubric (implemented in prompt — Claude calculates)
- Per section: 0–100; red flag deductions: high = −30, medium = −15, low = −5
- Section weights: Non-Compete = 3×, IP Assignment = 3×, Termination = 2×, all others = 1×
- `riskLevel`: `"low"` if >70, `"moderate"` if 40–70, `"high"` if <40

### No New Dependencies
`@anthropic-ai/sdk ^0.32.1` already supports `anthropic.messages.stream()`. `crypto.randomUUID()`
is a Node 19+ built-in. `uuid` npm package already installed as fallback if needed. No additions.

---

## Implementation Tasks

### Task 1: Create `backend/routes/analyze.js`
**File:** `backend/routes/analyze.js`
**Subagent:** Backend
**Type:** Create
**Description:**
Create the streaming route handler. This file exports a single async Express handler
`analyzeHandler`. It:

1. Validates request body — requires `contractText: string`. Returns `400` if missing.
2. Sets streaming response headers:
   ```js
   res.setHeader('Content-Type', 'application/x-ndjson');
   res.setHeader('Transfer-Encoding', 'chunked');
   res.setHeader('Cache-Control', 'no-cache');
   res.flushHeaders();
   ```
3. Calls `anthropic.messages.stream(...)` with the full-document prompt (see prompt below).
4. Accumulates text deltas in a `buffer` string. Splits on `\n`, validates each complete line
   with `JSON.parse`, writes validated lines to `res` via `res.write(line + '\n')`. Holds
   incomplete final chunk in buffer for next iteration.
5. After stream ends, flushes remaining buffer if valid JSON, then calls `res.end()`.
6. On error: if headers not sent yet, returns `res.status(500).json({ error })`. If headers
   already sent, writes `JSON.stringify({ error }) + '\n'` then `res.end()`.

**Prompt template to implement:**
```
You are an expert employment attorney analyzing contracts for everyday people.

Analyze the employment contract below. Identify all semantic sections (e.g. Compensation,
Non-Compete, Termination, IP Assignment, Benefits, Confidentiality, Dispute Resolution, etc.).

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
${contractText}
```

**Model to use:** `claude-sonnet-4-6` (ID: `claude-sonnet-4-6`)

The Anthropic client should be instantiated inside this module (not imported from `server.js`)
so the route is self-contained:
```js
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

**Depends on:** none

---

### Task 2: Update `backend/server.js`
**File:** `backend/server.js`
**Subagent:** Backend
**Type:** Modify
**Description:**
Remove the old `app.post("/api/analyze", ...)` handler (lines 27–105 in current file). Import
`analyzeHandler` from `./routes/analyze.js` and mount it:
```js
import { analyzeHandler } from './routes/analyze.js';
// ...
app.post('/api/analyze', analyzeHandler);
```
The rest of `server.js` (dotenv config, Anthropic init, CORS, db connection check, port) stays
**except** remove the `Anthropic` import and client instantiation — those now live in the route
module.

**Depends on:** Task 1

---

### Task 3: Rewrite `frontend/src/services/anthropicService.js`
**File:** `frontend/src/services/anthropicService.js`
**Subagent:** Frontend
**Type:** Modify
**Description:**
Delete the entire current file content and replace with a single exported function
`analyzeContractWithStreaming`. Remove `analyzeContractSection` and `analyzeEntireContract`
entirely — they are replaced.

```js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Streams a full-document contract analysis from the backend.
 * @param {string} contractText - Complete extracted text of the contract
 * @param {(event: SectionEvent | CompleteEvent) => void} onProgress - Called for each parsed NDJSON line
 * @param {(message: string) => void} onError - Called on network or parse failure
 *
 * SectionEvent: { type: 'section', section: { title, summary, redFlags, score } }
 * CompleteEvent: { type: 'complete', overallScore, riskLevel, topConcerns }
 */
export const analyzeContractWithStreaming = async (contractText, onProgress, onError) => {
  // ... (implement per the roadmap streaming parser pseudocode)
};
```

Key implementation details:
- Use `fetch` with `response.body.getReader()` and `TextDecoder`
- Split buffer on `\n`, process all complete lines, hold incomplete last element
- For each valid JSON line: if `obj.section` exists → call `onProgress({ type: 'section', section: obj.section })`; if `obj.overallScore !== undefined` → call `onProgress({ type: 'complete', ... })`; if `obj.error` → call `onError(obj.error)`
- Silently skip lines that fail `JSON.parse` (Claude occasionally emits a stray character)
- Catch top-level fetch errors and call `onError`

**Depends on:** none (can be written before backend, tested together)

---

### Task 4: Update `frontend/src/components/index.jsx`
**File:** `frontend/src/components/index.jsx`
**Subagent:** Frontend
**Type:** Modify
**Description:**
Three changes:

**A. Update imports:** Replace `analyzeEntireContract` import with `analyzeContractWithStreaming`.

**B. Update `analysisResults` state:**
```js
const [analysisResults, setAnalysisResults] = useState({
  sections: [],
  overallScore: null,
  riskLevel: null,
  topConcerns: [],
  analysisId: null,
});
```

**C. Update `analysisProgress` state:**
```js
const [analysisProgress, setAnalysisProgress] = useState({
  sectionsReceived: 0,
  currentSectionTitle: null,
});
```

**D. Rewrite the analysis call inside `handleFileUpload`:**
Replace the `await analyzeEntireContract(...)` block with:
```js
analyzeContractWithStreaming(
  fullText,
  (event) => {
    if (event.type === 'section') {
      setAnalysisResults((prev) => ({
        ...prev,
        sections: [...prev.sections, event.section],
      }));
      setAnalysisProgress((prev) => ({
        sectionsReceived: prev.sectionsReceived + 1,
        currentSectionTitle: event.section.title,
      }));
    } else if (event.type === 'complete') {
      setAnalysisResults((prev) => ({
        ...prev,
        overallScore: event.overallScore,
        riskLevel: event.riskLevel,
        topConcerns: event.topConcerns,
        analysisId: crypto.randomUUID(),
      }));
      setStage('results');
    }
  },
  (errorMessage) => {
    console.error('Streaming analysis error:', errorMessage);
    alert(`Error: ${errorMessage}`);
    setStage('landing');
  },
);
```

Note: `analyzeContractWithStreaming` is not awaited — it's fire-and-forget; callbacks drive state.
The `try/catch` wrapper in `handleFileUpload` should still cover `extractTextFromPDF` and
`renderAllPages`. The streaming error path is handled by the `onError` callback.

Also remove the now-unused `totalPages` state variable from `handleFileUpload`'s scope (it was only passed to `ProcessingScreen`; `ProcessingScreen` is also being updated to not need it).

**Depends on:** Task 3

---

### Task 5: Update `frontend/src/components/ProcessingScreen.jsx`
**File:** `frontend/src/components/ProcessingScreen.jsx`
**Subagent:** Frontend
**Type:** Modify
**Description:**
The component currently receives `{ progress: { current, total }, totalPages }`. Update to
receive `{ progress: { sectionsReceived, currentSectionTitle } }` (remove `totalPages` prop —
it's no longer meaningful since sections aren't page-bound).

Changes:
- `isAnalyzing` → `const isAnalyzing = progress.sectionsReceived > 0`
- Remove the percentage bar and `progress.current of progress.total` line entirely — we don't
  know total sections upfront
- Replace with a section counter: `{progress.sectionsReceived} section{progress.sectionsReceived !== 1 ? 's' : ''} analyzed so far`
- If `progress.currentSectionTitle` is set, show: `Currently analyzing: {progress.currentSectionTitle}`
- Keep the spinner and the `Brain` icon overlay (style unchanged)
- Remove the `<FileText>` "N pages detected" line (no longer relevant during streaming)

**Depends on:** Task 4 (new prop shape comes from `index.jsx`)

---

### Task 6: Update `frontend/src/components/AnalysisSidebar.jsx`
**File:** `frontend/src/components/AnalysisSidebar.jsx`
**Subagent:** Frontend
**Type:** Modify
**Description:**
This is the largest frontend change. The component now receives:
```js
{
  analysisResults: {
    sections: [{ title, summary, redFlags, score }],
    overallScore: number | null,
    riskLevel: 'low' | 'moderate' | 'high' | null,
    topConcerns: string[],
  },
  selectedText,
  onCopyText,
  onConsultLawyer,
}
```

Destructure at the top: `const { sections = [], overallScore, riskLevel, topConcerns = [] } = analysisResults;`

**A. Fix `expandedSections` state:**
```js
const [expandedSections, setExpandedSections] = useState({});

// Auto-expand first section when it arrives
useEffect(() => {
  if (sections.length === 1) {
    setExpandedSections({ 0: true });
  }
}, [sections.length]);
```
Toggle: `setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }))`.
Check: `expandedSections[index] === true`.

**B. Summary card:** Change from `{analysisResults.length} section(s) analyzed` to
`{sections.length} section{sections.length !== 1 ? 's' : ''} analyzed`. Keep red flag count.

**C. Section rendering:** Map over `sections` (not `analysisResults`).
- Header: `{section.title}` instead of `Page {result.sectionNumber}`
- Add score badge next to title: `{section.score}/100` with color coding:
  - score > 70: `bg-green-100 text-green-800`
  - score 40-70: `bg-yellow-100 text-yellow-800`
  - score < 40: `bg-red-100 text-red-800`
- Body: `{section.summary}` instead of `{result.simplified}`
- Red flags: unchanged structure, same `result.redFlags` → `section.redFlags`
- Feedback buttons: `key={index}` and `sectionIndex=index` stay the same

**D. Add overall score card** (insert between the summary card and sections list, only
render when `overallScore !== null`):
```jsx
{overallScore !== null && (
  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
    <h3 className="font-semibold text-gray-900 mb-3">Overall Assessment</h3>
    <div className="flex items-center gap-3 mb-3">
      <span className={`text-2xl font-bold ${
        riskLevel === 'low' ? 'text-green-600' :
        riskLevel === 'moderate' ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {overallScore}/100
      </span>
      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
        riskLevel === 'low' ? 'bg-green-100 text-green-800' :
        riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : ''} Risk
      </span>
    </div>
    {topConcerns.length > 0 && (
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">Top Concerns:</p>
        <ul className="space-y-1">
          {topConcerns.map((concern, i) => (
            <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
              <span className="text-orange-500 mt-0.5">•</span>
              {concern}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
```

**E. Feedback logging:** Update `handleFeedback` log to use `sections[sectionIndex].title`
instead of `analysisResults[sectionIndex].sectionNumber`.

**Depends on:** Task 4

---

## Validation Steps

1. **Lint:** `npm run check --prefix frontend` — must pass with zero errors
2. **Backend smoke test:** `npm test` from `backend/` — existing smoke tests must still pass
3. **Backend start:** `cd backend && node server.js` — must start without errors, show DB connection
4. **Frontend start:** `npm run dev --prefix frontend` — must compile and load at `http://localhost:5173`
5. **curl streaming test:**
   ```bash
   curl -X POST http://localhost:3001/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"contractText":"This employment agreement is between Acme Corp and John Doe. Section 1 - Compensation: Employee shall receive $120,000 annual salary. Section 2 - Non-Compete: Employee agrees not to work for any competitor in the United States for 2 years after termination. Section 3 - IP Assignment: All inventions created during employment, including those created on personal time, belong to the company."}' \
     --no-buffer
   ```
   - Verify multiple JSON lines appear progressively (not all at end)
   - Verify last line contains `overallScore`
   - Verify non-compete and IP assignment get low scores (<50)
6. **End-to-end UI test:**
   - Upload a multi-section employment contract PDF
   - `ProcessingScreen` should show section names appearing one-by-one
   - After stream completes, `ResultsView` opens with sections displayed
   - Each section card shows title, summary, red flags, and score badge
   - Overall score card appears at top of sidebar with risk level + top concerns
   - Thumbs up/down feedback buttons still work

---

## Rollback Notes
The `POST /api/analyze` request shape changes from `{ sectionText, sectionNumber }` to
`{ contractText }`. These are both changed atomically in this PR (Task 2 backend + Task 3
frontend), so no version skew window exists.

If rollback is needed: `git revert` the PR. The old page-by-page approach will resume.
No database migrations are involved — this is pure API/UI change.
