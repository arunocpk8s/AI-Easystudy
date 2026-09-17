# Validation and basic versus improved RAG

## Executed checks

- Node pipeline/API tests: **7 passed**. Checks page provenance, chunk coverage, retrieval, zero-match fusion, extractive references, model output contracts, token protection and provider failures.
- Playwright: **6 passed**, three workflows each on desktop and mobile. Covers real PDF extraction, material generation, source preview, quiz answers, flashcards, mind map, Markdown export, deletion and missing keyword evidence.
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