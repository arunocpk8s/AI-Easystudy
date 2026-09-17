# Study Atlas

A PDF-based study dashboard for Class 11/12 students and other learners. Upload a text PDF, create nine study aids, inspect source passages, and visualize the processing stages and timings.

## Quick start

Requires Node.js 22.13+ or 24 LTS and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. On macOS/Linux use `npm` instead of `npm.cmd`. Demo materials are original four-page physics notes, not NCERT excerpts. Upload your own authorized PDF to replace them.

Extractive mode works without an API key. It produces excerpts, recall cards, cloze quizzes and document-order study prompts. It does not provide LLM-generated summaries, verified misconceptions, or inferred prerequisite maps.

## Enable AI

Copy `.env.example` to `.env.local`. Configure `GROQ_API_KEY`, `GROQ_MODEL`, and a strong `STUDY_ACCESS_TOKEN`. Restart the dev server. Enter the workspace token under Settings, then select AI mode in Study studio or Ask your PDF. Never put secrets in `VITE_` variables. AI sends extracted evidence to Groq; the PDF itself remains on the device.

## Verify

```powershell
npm.cmd test
npm.cmd run evaluate
npm.cmd run build
node scripts/create-fixture.js
npx.cmd playwright install chromium
npx.cmd playwright test
```

## Documentation

- [Requirements](public/docs/REQUIREMENTS.md)
- [HLD and architecture](public/docs/HLD.md)
- [LLD and API contracts](public/docs/LLD.md)
- [Setup, deployment and troubleshooting runbook](public/docs/RUNBOOK.md)
- [Tools, MCP and Skill usage](public/docs/TOOLS.md)
- [Implementation plan](public/docs/IMPLEMENTATION-PLAN.md)
- [Validation and comparison](public/docs/VALIDATION.md)
- [Lessons learned](public/docs/LESSONS-LEARNED.md)

The same documents are available through Project guide in the dashboard.

## Boundaries

20 MB / 200 pages per PDF. No OCR, handwritten-note recognition, or diagram interpretation. Equations and multi-column reading order require manual checks. Documents, vectors, tokens and generation caches live in browser memory and clear on refresh. No cross-device persistence, accounts or production user authentication. The workspace token protects AI access but is not enterprise identity or per-user authorization. Do not publish an unprotected paid API endpoint.

## Vercel

The Vite frontend and `api/` functions are configured in `vercel.json`. Import the repository or run `npx vercel`, configure server secrets in Vercel, deploy, then smoke-test `/api/status` and AI generation. `vite preview` serves static assets only; it is not the API runtime. See the runbook for precise steps and the deployment status.
