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
