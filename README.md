Live application: [AI EasyStudy](https://ai-easystudy.vercel.app) | [GitHub repository](https://github.com/arunocpk8s/AI-Easystudy)

# Study Atlas

A PDF-based study dashboard for Class 11/12 students and other learners. Use Student view to upload a text PDF and create nine study aids, including connected graphical mind maps and roadmaps. Use Behind the RAG to inspect evidence and measured processing stages. Graphs support zoom, source inspection and SVG export.

## Quick start

Requires Node.js 22.13+ or 24 LTS and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. On macOS/Linux use `npm` instead of `npm.cmd`. Demo materials are original four-page physics notes, not NCERT excerpts. Upload your own authorized PDF to replace them.

Extractive mode works without an API key. It produces excerpts, recall cards, four-option source-recall MCQs and document-order study prompts. It does not provide LLM-generated summaries, verified misconceptions, or inferred prerequisite maps.

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

## Graphical design and printable study slides

- [Interactive HLD](public/docs/HLD.html) and [LLD](public/docs/LLD.html)
- [HLD SVG](public/docs/HLD.svg) and [LLD SVG](public/docs/LLD.svg)
- Notebook-style graphs and structured notes support Print / Save PDF.
- `node scripts/capture-notebooks.js` creates demo PDFs and screenshots in `artifacts/` while the local server runs.

Tamil or Hindi selection uses local translation for source-mode uploaded documents. No server keys are needed. Explicit AI explanations still require server keys. The original demo provides clearly labelled, manually authored English/Tamil demo materials without an AI service. AI content quality on arbitrary school PDFs still needs teacher review and live-provider evaluation.

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

## Local Tamil / Hindi translation — no API key

1. Upload an English text PDF and select **Tamil** or **Hindi**.
2. Choose a study tool. Source mode automatically uses **Local translation — no API key**. You can also select this mode in Settings or Study studio.
3. Keep the tab open while the first model download completes (about 895 MB of q8 weights, plus tokenizer/runtime files). Progress shows each file and each translated passage. A laptop with sufficient RAM is recommended; download and generation can take minutes.
4. Inspect page citations. Formulas and original textbook quotations stay unchanged; notes, graph labels, questions and answers are translated locally.
5. For Q&A, Tamil questions are translated to English locally, then relevant English passages are retrieved and a source-based answer is translated to the selected language. No Groq request is made.
6. Use **Cancel translation** if needed; select English to continue with source preview. Retry downloads may reuse browser-cached files.

The downloadable model is still AI, but runs on your device without a paid API. This mode translates source aids; it does not generate new tutoring explanations or solve questions beyond retrieved evidence. Currently intended for English PDFs and English/Tamil/Hindi questions; other source languages are unsupported. Browser caching depends on storage availability/eviction, and the webpage is not a full offline PWA.

Model: [Xenova NLLB-200 distilled 600M](https://huggingface.co/Xenova/nllb-200-distilled-600M), pinned revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea. Base model by Meta AI, CC-BY-NC-4.0 (educational/non-commercial use). Runtime: [Transformers.js](https://huggingface.co/docs/transformers.js/tutorials/react), WASM in a dedicated worker.

A real-model smoke check is available via `node scripts/smoke-local-translation.js` while the development server runs. It downloads model files; it is separate from lightweight mocked UI tests.

Physics subject mode uses a small project-authored terminology glossary for exact labels, electrical context for the ambiguous word charge, and Tamil charge/fee normalization. It does not establish sentence accuracy. Sentence-level segmentation prevents short paragraphs being silently condensed into one model output. Browser tests mock inference; live smoke outputs are recorded separately.

Live smoke testing confirmed local inference and Tamil→English queries, but found incorrect physics sentence wording even after segmentation/terminology assistance. Local translations therefore show original wording alongside notes, revealed flashcards, submitted quiz feedback, answers and graph inspectors. Treat this feature as experimental translation assistance; it is not validated Tamil tutoring. Reports preserve the observed errors rather than claiming language accuracy from unit/UI tests.

## Visual flashcards and MCQs

Flashcard answers include source-linked SVG concept diagrams, key points and formulas when present. Reveal one card or all cards; download individual SVG images or print cards. Flashcard diagrams organize source evidence, not extracted PDF images.

Every quiz has four-option MCQs. Demo questions are manually authored conceptual physics practice. Uploaded PDFs without cloud AI produce exact-source-wording recall MCQs using document vocabulary as distractors (maximum 10). Cloud mode generates conceptual MCQs. Feedback, correct options, score and supporting sources appear after checking answers. Hindi/Tamil local translation preserves original wording and resolves collapsed option translations using original labels. Machine-translation correctness still needs review.

## Publishing

Repository: https://github.com/arunocpk8s/AI-Easystudy

Build with `npm.cmd run build`. Deploy using `npx.cmd vercel --prod --yes`, or import the GitHub repository into Vercel with the Vite preset. Local translation needs no server secret; optional cloud explanations require GROQ_API_KEY and STUDY_ACCESS_TOKEN set in Vercel project settings.
