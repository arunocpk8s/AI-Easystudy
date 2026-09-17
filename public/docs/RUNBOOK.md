# Runbook

## 1. Local prerequisites

Install Node.js 22.13+ or 24 LTS and Git. Clone or open this project. Windows PowerShell may block npm.ps1; use npm.cmd and npx.cmd rather than changing the machine execution policy.

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. Local Vite middleware serves `/api/status` and `/api/study` as well as the dashboard. Keep the terminal open.

## 2. No-key workflow

1. Explore the demo, which uses original physics notes.
2. Upload a text-based PDF smaller than 20 MB / 200 pages.
3. Review extraction warnings.
4. Open Study studio and create notes, flashcards or a quiz in Extractive mode.
5. Open source buttons to inspect passages and original PDF pages.
6. Ask a specific question in Source excerpts mode.
7. Open Behind the answer to inspect measured durations and evidence.

## 3. Configure AI

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` locally:

```text
GROQ_API_KEY=<your-provider-key>
GROQ_MODEL=<currently-supported-chat-model-with-json-output>
STUDY_ACCESS_TOKEN=<strong-random-private-workspace-token>
```

Default model is `llama-3.3-70b-versatile`; verify current support with the provider before relying on it. Do not commit actual secrets or send them in chat. Restart `npm.cmd run dev`. Check `/api/status` reports `aiConfigured: true`. In Settings enter only the workspace access token. Select AI mode and output language, then generate a small document first.

## 4. Semantic search

In Ask your PDF, select Enable semantic search. Initial use downloads the multilingual model; the webpage shows indexing progress. Vectors are computed on the device and remain in memory. If the download fails, keyword retrieval remains available. A three-question Tamil fixture was measured: expected evidence appeared in top 3, but first-result accuracy was 1/3. This is not sufficient for reliable Tamil retrieval.

## 5. Verification

```powershell
npm.cmd test
npm.cmd run evaluate
npm.cmd run build
node scripts/create-fixture.js
npx.cmd playwright install chromium
npx.cmd playwright test
```

Check `evaluation/results/baseline.json`. The baseline covers a small original English fixture, not complete CBSE quality. Browser tests cover extraction, material generation, citations, quiz reveal and responsive layout. See VALIDATION.md for actually executed checks. Optional real-model evaluation: with npm run dev active, run `node scripts/evaluate-semantic.js`; it downloads public model weights and writes hybrid.json.

## 6. Vercel deployment

Preferred path: connect the Vercel MCP integration, select the intended account/team, and deploy the verified repository. Account/team identifiers must come from the connected provider. Deployment is not verified merely because vercel.json exists.

Alternative supported CLI path:

```powershell
npx.cmd vercel login
npx.cmd vercel
```

Select the intended project/team. Framework: Vite. Build: npm run build. Output: dist. API routes reside in api/. Configure GROQ_API_KEY, GROQ_MODEL and STUDY_ACCESS_TOKEN in Vercel project environment variables for the intended deployment environment. Redeploy after changing them. Preview deployment first, smoke-test, then deploy production:

```powershell
npx.cmd vercel --prod
```

Do not put provider secrets in frontend build variables. The workspace token is a prototype gate; use proper user authentication and quotas before sharing a paid AI endpoint widely.

## 7. Deployment smoke test

- Homepage renders on desktop and mobile.
- `/api/status` returns configuration status without secrets.
- Upload the generated two-page fixture and inspect sources.
- Generate no-key notes and complete a quiz.
- Confirm an unauthenticated AI POST returns 401 when configured.
- Enter workspace token and generate one AI summary; inspect every source.
- Ask an unsupported question and check that evidence limitations are visible.
- Open Project guide and verify documentation links.
- Inspect measured timings and provider usage.

## 8. Troubleshooting

| Symptom | Action |
|---|---|
| Scanned PDF has no readable text | Use a text-based PDF or externally OCR it; integrated OCR is not available |
| Formula or reading order is wrong | Inspect original pages; do not trust incomplete extraction |
| AI not configured | Set both server key and workspace token, then restart/redeploy |
| 401 | Verify the workspace access token, not the Groq key |
| 429 | Wait and inspect provider quota; avoid repeated full-book generation |
| 502 | Check current model availability, JSON-output support and timeout; retry a smaller document |
| Tamil in extractive mode | Switch to AI mode; extractive mode does not translate |
| Semantic model fails | Check model download access and browser memory; use keyword search |
| Refresh lost work | Expected: session-only memory; export materials before refreshing |
| API unavailable in vite preview | Use npm run dev for local API or Vercel deployment for runtime functions |

## 9. Recovery and rollback

Use Git history to identify the last passing source state. Redeploy that state or restore a known-good Vercel deployment through the provider. Keep secrets configured separately. A failed generation does not replace previously cached material. Removing a document clears local artifacts; no server document database exists to restore.

## Graphical study tools

In Student view choose Mind map or Study roadmap. Click a node to open its full text and source buttons. Use zoom controls and scroll the canvas. More than six topics are paginated; no topics are silently discarded. Export SVG saves the displayed diagram page, while the general Markdown export saves all study items. In the roadmap, Mark as reviewed tracks progress for this session. Class, subject and language choices guide generation; they do not verify syllabus alignment. The Behind the RAG tab distinguishes measured work from optional embedding and unavailable OCR.

## Visual study workflow

1. Configure GROQ_API_KEY and STUDY_ACCESS_TOKEN on the server; restart locally or redeploy on Vercel.
2. Enter the workspace token in Settings. Select English or Tamil. Tamil uploaded-document source aids select local translation automatically. Explicit AI explanations remain available with configured server keys.
3. Generate notes, mind map or roadmap. Check individual source links before trusting an explanation.
4. Use Print / Save PDF for notebook slides or Export SVG for editable diagrams. On large documents use graph pagination to inspect every topic.
5. Open Visual HLD / LLD, select components, and download SVG or print standalone diagrams.

The bilingual original demo is manually authored. Source preview preserves language; local mode translates English source aids into Tamil. Live AI reliability and Vercel deployment require actual service configuration; mock tests do not establish them.

## Browser-local translation

No provider API key is required. English source aids → Tamil using q8 NLLB in a dedicated web worker. Tamil questions → English before retrieval. Original page references, formulas and quoted excerpts remain exact. Translation errors are visible and cancellable; cached models depend on browser storage. First download is approximately 900 MB plus runtime/tokenizer files. Local mode translates selected source content, not new teacher explanations. Intended for English PDFs; technical translation needs review.

Modules: `src/lib/translation.js` (worker lifecycle), `translation-core.js` (structured provenance-safe traversal and bounded segments), `src/workers/translation.worker.js` (download, WASM translation, sequential queue and in-memory translation cache). Cache strings are cleared on document replacement/removal; model files may remain in browser cache. Model pinned to Xenova/nllb-200-distilled-600M at revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea, CC-BY-NC-4.0, based on Meta NLLB-200.

## Blank-page notices and reading outputs

Refresh and upload the PDF again after updating this version; existing in-memory documents keep their earlier parsing report. Read Document reading summary: blank pages are skipped automatically, short text is included, and visible no-text content needs manual review. Open Check page coverage to inspect each original PDF page. For scanned text, prepare a searchable PDF with OCR elsewhere and upload it. For diagrams, inspect the original page.

Mind maps and roadmaps open in Fit page. Use Fit graph to page after manual zoom. Read the complete topic content below the graphic without zoom; expand subtopics and check source pages. Changing outputs resets diagram zoom.
