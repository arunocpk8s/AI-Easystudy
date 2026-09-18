# Validation and basic versus improved RAG

## Executed checks

- Node pipeline/API tests: **8 passed**. Checks page provenance, chunk coverage, retrieval, zero-match fusion, extractive references, model output contracts, token protection and provider failures.
- Playwright: **10 passed**, five workflows each on desktop and mobile. Covers real PDF extraction, material generation, source preview, quiz answers, flashcards, mind map, Markdown export, deletion and missing keyword evidence.
- Production build: passed on Node 24.20.0.
- Dependency audit after updating PDF.js and Transformers.js: **0 known vulnerabilities**.
- Repository Skill validation: passed. Skill-creator validator needed PyYAML, installed in an ignored project-local temporary folder.
- Visual review: captured and inspected desktop/mobile screenshots in `artifacts/`.
- Real-model browser evaluation: completed using `Xenova/multilingual-e5-small`, WASM q8, on the original demo fixture.

## Observed small-fixture results

| Metric | Keyword baseline | Hybrid E5 + RRF |
|---|---:|---:|
| English answerable questions: expected page first | 8/8 | 8/8 |
| English answerable questions: expected page in top 3 | 8/8 | 8/8 |
| Unrelated questions: no candidates returned | 2/2 | 0/2 |
| Tamil questions: expected page first | Not evaluated in baseline report | 1/3 |
| Tamil questions: expected page in top 3 | Not evaluated in baseline report | 3/3 |

Hybrid returns nearest passages even for unrelated questions; it has no calibrated relevance rejection. Extractive results explicitly ask the learner to check relevance. AI is instructed to decline insufficient evidence, but actual refusal quality is not verified without provider credentials. A broader dataset, relevance checks and potentially query translation/reranking are needed.

E5 indexing including model initialization/download took about **27.3 seconds** for four demo chunks in this run. Subsequent query embedding plus search took approximately **23–34 ms**. These numbers exclude LLM generation and do not predict textbook or other-device latency.

This is a small original physics fixture, not teacher-reviewed CBSE evaluation. Results are in `evaluation/results/baseline.json` and `evaluation/results/hybrid.json`. The initial MiniLM experiment is preserved separately; it also ranked two Tamil definitions poorly.

## Review findings and fixes

Applied `.agents/skills/rag-quality-review/SKILL.md` for the pipeline review:

- Source page numbers survive extraction and chunking; source viewer targets original PDF pages.
- Whole-document AI batches include every readable chunk once; study materials are section collections rather than a globally synthesized book summary.
- API rejects unknown source IDs and quizzes without answers. This does not prove factual claim support.
- Extractive outputs, inferred confusion prompts and document-order roadmaps are labelled honestly.
- Fixed a hybrid ranking bug where zero-match keyword ranks biased multilingual results.
- Fixed mobile test selection of a hidden sidebar filename; visible upload/extraction worked.
- Reduced the initial JavaScript bundle by importing only used icons.
- Upgraded dependencies after audit identified parser/runtime advisories.
- Guarded document removal during active processing and measured evidence selection rather than displaying an invented duration.

## Implemented comparison

| Area | Basic | Improved option | Boundary |
|---|---|---|---|
| Search | BM25 keyword | Multilingual E5 + RRF | Tamil ranking still needs improvement |
| Context | Ranked passages | Exact duplicate removal | No full near-duplicate removal or reranker |
| Coverage | Top-K Q&A | Full section batching | No final global synthesis pass |
| Grounding | Source buttons | Schema and source-ID validation | Teacher claim-support review needed |
| Evaluation | Original English fixture | Real multilingual model experiment | No broad quality claims |
| Observability | Excerpts | Evidence timelines, token counts and real timings | Live provider measurements pending |

## Unverified / not implemented

Live Groq generation, AI Tamil accuracy, AI answer grounding, OCR, diagrams, persistent accounts/storage, production authentication, distributed quotas and live Vercel deployment. No result here should be used as evidence those capabilities passed.

## Deployment status

Vercel-ready configuration is present. Vercel MCP was found but is not connected. No live Vercel URL was produced. Configure the Groq server key and workspace access token for AI mode; connect Vercel or authenticate its CLI for deployment.
## Reference UI improvement review

Replaced the sidebar overview with Student view and Behind the RAG tabs matching the supplied reference structure. Added class/subject/language controls. Mind maps and roadmaps now use connected SVG nodes with zoom, paginated coverage, source inspection and export. Roadmaps support local reviewed state. New browser checks verify these on desktop/mobile, including keyboard Escape from source dialogs. Selector accessible names were corrected after the first new test run. AI MCQ options and answers are schema-validated; live generation is still unverified without credentials. PDF preparation has separate measured validation, decode, structure, chunk and source-lookup timings. The dashboard does not claim OCR, Qdrant or fixed processing-time estimates.

A mocked AI response also verified multiple-choice selection, hidden feedback before submission, and forwarding of class/subject context. This validates UI behavior, not live provider quality.

## Notebook and graphical design update

- 12 Node tests passed: source selection/refusal, compact formulas, page provenance, manually authored Tamil demo, nested citations and exact quotation validation.
- 14 Playwright cases passed across desktop/mobile: notebook notes, graphical source navigation, quiz, responsive upload, interactive HLD/LLD and mocked Tamil query translation before retrieval.
- Production build passed; English demo keyword golden evaluation remains 8/8 answerable hits at rank 1 plus two unsupported cases. This is not a textbook answer-quality benchmark.
- Printable original demo artifacts: mind map, roadmap, four-topic notes; HLD/LLD exported as HTML, SVG and PDF. English mind map and HLD screenshots visually inspected.
- A failing formula-preservation test identified short-sentence filtering; fixed by preserving compact mathematical statements. Architecture print pagination was corrected to a landscape diagram page.
- Live Groq explanations and Tamil translation on arbitrary PDFs remain unverified because server secrets are absent. Vercel deployment awaits account authentication.

## Local translation update

- 15 Node tests passed, including structured citation/quote/formula preservation, sentence coverage, quiz consistency and scoped physics terminology.
- 18 desktop/mobile Playwright cases passed; the four local cases passed again after original-comparison and worker lifecycle changes. Local UI uses mocked inference and asserts no cloud study requests.
- Actual WASM NLLB English→Tamil and Tamil→English inference ran in Chromium without service keys. Final smoke elapsed ~200 seconds including ~900 MB download. Tamil query became "What is a charge?". Tamil physics statements remained grammatically/semantically weak. Raw outputs retained in evaluation/results/local-translation*.json. This is a known limitation, not an answer-quality pass.
- Paragraph condensation observed initially; changed to sentence-by-sentence inference. Exact title glossary and electrical-charge context help terminology but do not validate sentences. Original wording is now available alongside translated outputs; source evidence remains intact.
- Packaged production worker loaded and visibly reported an intentionally interrupted weight download. Full production inference was not repeated; real inference test used development worker.
- HLD/LLD diagrams include the browser-local path; each architecture PDF remains one landscape page. Provider/live tutoring and Vercel deployment remain separate unverified integrations.

## Blank-page and reader correction

- 16 Node tests passed, including blank/visual/unknown classification, sparse headings and original page-number preservation.
- All 22 desktop/mobile browser cases passed in the final full run. Initially the two new page-coverage cases failed because the visible warning lacked an alert role; accessible alert semantics corrected that.
- Actual generated PDF contains readable page 1, a white-filled blank page 2, short heading page 3 and visual-only page 4. Page 2 is skipped without OCR warning, page 3 retains citation p. 3 S2, page 4 is flagged; blank page can be inspected.
- Fit-page default, reset between mind map/roadmap, no inner vertical canvas scrolling, responsive width and detailed source-linked reading sections passed.
- Production build and English fixture retrieval evaluation passed. This does not verify the user PDF, OCR, diagrams or Tamil answer correctness.

Normal-size topic-reader screenshot visually reviewed; definitions, formulas, self-checks and block-level page references are readable.

## Visual cards, MCQs and Hindi release

- 18 Node tests passed. Cloud quizzes reject descriptive output and require four unique options with one matching answer. Local source MCQs retain valid page citations. Hindi mapping uses hin_Deva; translated answer indices survive duplicate option wording through original-label disambiguation.
- 28 desktop/mobile browser cases passed: diagram reveal, individual second-card SVG download, reveal-all, four-option MCQs, score/feedback, source links, Hindi local content and Hindi query translation before retrieval. Hindi browser inference is mocked; it does not establish language quality.
- Production build and original English keyword retrieval evaluation passed. Cloud live Hindi generation is not tested without provider keys.
- GitHub MCP fetched the user-supplied AI-Easystudy repository and confirmed it was empty with push permission. Vercel CLI account authentication succeeded. Deployment status will be recorded separately after public checks.


## Public production verification — 17 September 2026

The public deployment at https://ai-easystudy.vercel.app passed an unauthenticated Chromium smoke test: homepage, three language choices, four visual demo flashcards, four-option MCQ scoring, real fixture PDF extraction and evidence search, interactive graphical HLD/LLD, exported architecture/runbook, and mobile width. `/api/status` correctly reports cloud AI disabled and `/api/study` returns 503 without provider configuration. GitHub is connected to Vercel for subsequent deployments. See `evaluation/results/production-smoke.json`.

A real local Hindi WASM smoke test translated a basic English sentence into Hindi and a Hindi question into English, taking 194 seconds including initial loading. See `evaluation/results/local-translation-hindi.json`. This does not establish full physics translation quality or full production-worker inference. Existing release checks: 18 unit tests and 28 desktop/mobile browser tests passed; the small original English golden dataset achieved 8/8 answerable retrieval hits.


## Focused professional diagrams — 18 September 2026

Professional fonts replace handwriting in mind maps and roadmaps. Source-specific graph selection considers all chunks, merges exact repeated facts with their source IDs, removes activity/footer boilerplate, and selects up to three complete facts with topic overlap, concept diversity, and definition/formula/unit/negation signals. All-book reading beneath graphs is replaced by one selected topic's essentials and citation controls. Node heights grow with content; demo leaf and step elements were checked for clipping and showed no overflow. Visual screenshots are in `artifacts/professional-mindmap.png` and `artifacts/professional-roadmap.png`.

The first browser run exposed a short paragraph being removed because it was also the heuristic page title. This was fixed and covered by a regression test. Chunking now retains original line boundaries so headings do not contaminate fact labels. 24 unit tests passed; the full 28-case browser suite passed after the fix, and the final graph-specific acceptance suite includes ten desktop/mobile checks (including actual uploaded PDF selection and citation navigation). Golden retrieval remained 8/8 answerable hits at top one/top three on the original fixture; this does not measure textbook-wide study quality.

GitHub MCP was used to confirm the published main branch before this release. Groq graph prompts and schema validation now require concise output, but cloud generation remains unconfigured and was not live-provider tested. Source-based graphs work without a key; local translation browser checks mock inference and are not language-quality measurements.


## Browser-local printed OCR — 18 September 2026

Tesseract.js 7.0.0 now recognizes printed English/Tamil/Hindi image-only PDF pages on-device. Successful transcriptions are indexed with original page numbers and OCR provenance; white blank pages skip recognition. Existing selectable text is retained. Empty/noisy/low-scoring recognition is excluded; failed pages are shown in coverage without discarding other readable pages. The upload supports cancellation during initialization and recognition, retaining the previous document. Native workers and canvases are released on success/failure/cancellation. OCR runtime and language packages are pinned in static download paths.

All 29 unit tests and all 40 desktop/mobile browser checks passed, including ten OCR-specific checks. Two real tests hold/abort core downloads at browser-context level to verify startup cancellation and failure worker cleanup; the six other OCR UI cases mock recognition. Actual production-preview smoke tests recognized original image-only English/Tamil/Hindi fixtures, skipped blank page 2, preserved original page citations, showed measured OCR duration, and left zero workers after completion. Reports in `evaluation/results/ocr-english.json`, `ocr-tamil.json`, and `ocr-hindi.json` contain actual recognized strings and timings.

OCR errors were observed in Tamil/Hindi. Using the selected script's model instead of combining it with English reduced Latin-script substitutions in Hindi, but some spelling errors remain. The initial and final reports preserve this evidence. These are synthetic clear printed fixtures, not CBSE textbook accuracy, mathematical OCR, handwriting or diagram benchmarks. Scans should be reviewed against their original pages. Mixed pages with a selectable layer are not automatically OCRed for additional image text. Live cloud explanations and diagram interpretation remain unverified/unsupported respectively.


OCR integration also exposed a source-aid heading heuristic that could delete a first sentence when it was used as a page title. It now removes only standalone headings, retains full-sentence titles as evidence, and keeps short essential source facts. A regression test covers this across notes as well as OCR provenance.

## Professional short notes — 18 September 2026

Short notes now use professional sans-serif headings and body text, a clean white page, stronger text contrast, readable source references, and clearly separated concept/formula/example/revision sections. Existing Tamil/Hindi script fonts and original source links remain available. All 28 relevant desktop/mobile dashboard, translation and OCR browser checks passed; the production build passed. A browser capture verified normal typography and mobile width, and exported the printable notes. See `artifacts/professional-short-notes.png` and `artifacts/notebook-notes.pdf`. This is a presentation change and does not establish new model/content accuracy.

## Multi-format ingestion — 18 September 2026

31 unit tests and all 60 desktop/mobile browser checks passed. New fixtures exercise actual local DOCX paragraph extraction, PPTX presentation slide order, legacy PPT storage records, XLS/XLSX sheets, CSV, XML and text; source labels, original-file controls, notes and mobile width are checked. An image UI test mocks recognition; separate actual Tesseract browser-preview tests recognized clear printed English PNG, JPG, JPEG, GIF, GIFF and BMP images, retained source/image previews and notes, and released all workers. See `evaluation/results/image-formats.json`. These original fixtures do not establish Office/textbook-wide accuracy or diagram interpretation. Existing small English retrieval evaluation remains 8/8 answerable hits.

Initial acceptance failures included outdated upload/button labels and cold PDF module loading exceeding the old five-second assertion limit under six parallel workers. Labels were updated and asynchronous assertions allow 15 seconds; the final full suite passed. Legacy `.doc` files are explicitly rejected with DOCX/PDF conversion instructions. Server conversion is not enabled because it would change the local-processing boundary. New HLD/LLD diagrams show the multi-format readers.


The public Vercel deployment subsequently passed all 20 multi-format desktop/mobile checks, including actual compiled PNG OCR. Separate actual image OCR smoke tests passed PNG, JPG, JPEG, GIF, GIFF, BMP and WebP; recognized text, timings, browser errors and worker cleanup are recorded in `evaluation/results/image-formats-production.json`. These are clear original printed English fixtures. No live cloud generation, DOC conversion, animated GIF coverage or Office visual interpretation is claimed.

## Animated RAG and MCP walkthrough — 18 September 2026

All 33 unit tests and 20 relevant desktop/mobile browser checks passed, including six new flow checks. Tests cover playback advancement, pause stability, manual selection/next/restart, switching between document/question/material/development paths, whole-document coverage labels, actual source-mode and retrieved-evidence labels, mobile width, and reduced-motion effects. Playback made no study API calls. Unit checks verify optional OCR/vector/cloud states and that MCP is accurately described as a development integration rather than an upload/question runtime tool. The production build passed. Small English fixture retrieval remains 8/8 answerable hits at top one/three.

Screenshots: `artifacts/animated-rag-desktop.png`, `animated-mcp-desktop.png`, and `animated-rag-mobile.png`. Educational playback speed is explicitly separate from measured processing latency; the walkthrough does not run external MCP/model tools. Existing cloud browser checks mock the provider and do not establish live LLM quality. No new retrieval, OCR or translation algorithm was introduced in this release.

## JPG draft quality and review — 18 September 2026

The reported input was handwriting or a diagram; the implemented engine supports printed OCR only. Earlier checks allowed page scores down to 45 and indexed image OCR directly. The revised implementation increases the diagnostic gate to 65, rejects symbol/script/word-score noise, preserves more resolution for large images, modestly enlarges only small images, and requires image-text approval before indexing or generation. Handwriting/diagram mode skips OCR and accepts only a student-supplied reviewed transcription; no automatic handwriting or diagram reading is claimed.

36 unit tests passed. The initial 70-case desktop/mobile run passed 68 cases and exposed an enabled Ask navigation control while image text awaited review. The control was fixed; all 34 relevant image-review, format-ingestion and OCR desktop/mobile checks subsequently passed, including corrected text reaching notes with genuine Image 1 references. A malformed new unit-test fixture was corrected before the successful unit run. Build and the small original English retrieval evaluation passed (8/8 answerable hits).

Actual browser-preview OCR passed seven clear printed English image extensions and three English/Tamil/Hindi scanned PDF fixtures, retaining original sources and releasing workers. An intermediate experiment enlarged already-readable text unnecessarily and confused SI with Sl; scaling now enlarges only small images, and the final fixture reads SI correctly. These results are not handwriting/diagram recognition or textbook accuracy measurements; Tamil/Hindi spelling errors remain. Reports in `evaluation/results/image-formats.json` and `ocr-*.json` record recognized text.

## AI generation contract fix — 2026-09-18

A live Groq reproduction with a small electric-charge evidence fixture returned mind-map JSON without `items` and roadmap fields with strings where evidence blocks were required. These completed in seconds: the generic timeout/invalid-output message concealed schema failures. English notes, quizzes and flashcards succeeded before the change.

`server/study-schema.js` now builds feature-specific strict JSON schemas for supported models (GPT-OSS 120B/20B and Qwen 3.8), including supplied source-ID enums. Optional evidence blocks use nullable fields that are removed before existing Zod validation. Other models retain JSON-object mode. The server still checks nested citations, four-option answers, exact textbook quotations and graph concision. Schema adherence does not establish factual grounding.

Generation uses low reasoning effort for GPT-OSS, a 50-second overall budget, at most two provider calls and validation feedback on the second call. A rejected result is never saved. Provider timeouts return 504; exhausted structure/source validation returns 502; rate limits remain 429 and are not automatically retried. Usage includes both generation attempts. Default setup model is now the account-tested `openai/gpt-oss-120b`.

Validation: 37 unit tests passed, including invalid-to-valid retry, repeated unknown-source rejection, optional-null normalization, aggregate usage and timeout classification. English keyword evaluation remains hit@1=1 and hit@3=1 on the original small demo fixture, not an answer-quality benchmark. Production build passed. Four desktop/mobile AI quiz and Tamil retrieval browser checks passed with mocked provider responses.

Real-provider tests through the revised local server handler: English notes, mindmap, roadmap and quiz succeeded; Tamil mindmap and Hindi roadmap succeeded. Some mindmaps needed the bounded validation retry. A rapid all-feature run was rate-limited after four successes, so it does not validate every feature/language combination. These use a short synthetic charge fixture, not the user's failing document. No credentials or document contents were logged.
