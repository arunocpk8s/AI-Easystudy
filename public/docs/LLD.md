# Visual low-level design

Open [interactive LLD](LLD.html) or [download SVG](LLD.svg). The application has the same diagram under **Visual HLD / LLD**.

## Structured study outputs

AI notes use evidence-linked definitions, key points, formulas, examples, exact textbook quotes and checkpoints. Mind maps require named subtopics. Roadmaps require learning goals and checkpoints. Nested source IDs are checked; quotes must match cited evidence. ID validation does not establish semantic correctness. Tamil questions are translated into English search terms before retrieval; the original question and Tamil output preference are retained for answering. Translation and answer token usage are combined.

# Low-Level Design

## Modules

| Module | Responsibility |
|---|---|
| `src/App.jsx` | Two main views, session state, uploads, generation batches, Q&A, source modal, quiz, exports |
| `src/components/StudentDashboard.jsx` | Reference-style tool grid, upload, class/subject/language choices |
| `src/components/RagPipeline.jsx` | Eight-stage preparation/generation visualization with measured or unavailable statuses |
| `src/components/StudyGraph.jsx` | Connected SVG mind map and roadmap, zoom, source inspector, pagination, SVG export, review state |
| `src/lib/pdf.js` | PDF header/size/page checks, PDF.js worker, extraction warnings, page metadata |
| `src/lib/rag.js` | Tokenization, chunking, BM25, rank fusion, exact duplicate removal, section batches |
| `src/lib/semantic.js` | Lazy multilingual feature-extraction pipeline and normalized vectors |
| `src/lib/materials.js` | Feature catalogue and non-LLM extractive fallbacks |
| `api/study.js` | Authentication, input/output validation, Groq request and error mapping |
| `api/status.js` | Non-secret configuration status |
| `vite.config.js` | React build and local API middleware |

## Data contracts

```text
Page = { page: positive integer, text: string }
Chunk = { id: S<number>, page: positive integer, title: string, text: string }
StudyItem = { title: string, body: string, sources: source ID[], answer?: string, options?: string[] }
Trace = { kind, mode, stages: {name, ms, detail}[], evidence: Chunk[], usage? }
Document = { name, pages, chunks, warnings, parsingMs, chunkingMs, demo? }
```

State is browser memory only. Replacing/removing a document clears results, vectors, evidence, responses and the previous PDF object URL. Material cache keys contain feature, generation mode, language, class and subject; all material state is reset on document replacement. The embedding pipeline may remain loaded across documents, but document vectors are cleared.

## Chunking and ranking

- Chunk size: 150 whitespace-delimited words; overlap: 25 words.
- Chunks never cross PDF pages; trailing content is preserved.
- Title: first short nonempty extracted line, otherwise a page label. Heading detection is heuristic.
- Unicode letter/number tokenization; small English stopword list.
- BM25 constants: k1=1.2, b=0.75.
- Keyword results require positive term score.
- Optional vectors: `Xenova/multilingual-e5-small`, WASM, q8, mean pooling and normalization. Prefix document text with `passage: ` and questions with `query: ` as required by the model card.
- Hybrid score: sum of `1/(60 + rank)` across keyword and semantic lists.
- Exact duplicate text is removed; overlapping but non-identical chunks are not fully deduplicated.
- Scores are ranking values, not calibrated confidence.
- Top K: five for Q&A. Section batching includes all chunks for whole-document AI tools.

## API contract

### GET /api/status

Returns `{aiConfigured: boolean, model: string}`. No API keys or tokens returned.

### POST /api/study

Header: `x-study-token` must equal server `STUDY_ACCESS_TOKEN`.

```json
{
  "feature": "ask",
  "language": "English",
  "question": "What is electric charge?",
  "evidence": [{"id":"S1","page":1,"title":"Charge","text":"Like charges repel."}]
}
```

Response:

```json
{
  "items": [{"title":"Electric charge","body":"...","sources":["S1"]}],
  "generationMs": 1234,
  "usage": {"prompt_tokens":100,"completion_tokens":80},
  "model": "configured-model-id"
}
```

Limits: question 1,000 characters, 100 evidence chunks, 12,000 characters/chunk, 30,000 total evidence characters, serialized request 120,000 characters. Current client batches are approximately 10,000 evidence characters. Provider timeout is 45 seconds and output cap 3,500 tokens. Model responses must have 1–40 valid items; quizzes require an answer. Every item's source IDs must belong to supplied evidence. The system requests a maximum of 12 items per batch.

Errors: 400 invalid contract; 401 bad token; 405 wrong method; 413 oversized evidence; 429 provider rate limit; 502 upstream failure/invalid result; 503 missing configuration.

## Generation and UI

Feature-specific instructions request grounded notes, mind-map branches, flashcards, short-answer quizzes, revision points and roadmaps. Class/subject are user-selected generation context, not automatic document classification or multi-document filters. Practice question prompts request suggested 1/2/3/5-mark formats rather than an official marking scheme. The prompt prohibits official exam predictions and treats PDF instructions as untrusted data. This reduces risk but does not guarantee immunity to prompt injection.

Extractive mode uses source sentences. Flashcards reveal excerpts; quizzes mask one source word and use self-check. Confusion prompts are explicitly generic review prompts. Roadmaps follow document order. AI outputs are reviewed by users rather than automatically fact-checked.

Mind-map implementation: connected SVG document root → topic branches → up to two source-linked evidence snippets per topic. Repeated topic titles are grouped without losing sources. The roadmap uses a connected document-order step diagram with a per-session reviewed state. Graphs show six topics per page with previous/next controls, zoom, keyboard-selectable nodes, a focused selected-topic inspector and SVG export. The diagram is scrollable rather than draggable. No verified prerequisite dependency network is inferred. Quiz self-assessment avoids unreliable exact-string grading. AI quizzes may include multiple-choice options; choices must be distinct and the answer must exactly match one option. Extractive quizzes remain cloze questions.

## Telemetry

Use `performance.now()` for local durations and server generation elapsed time. Total request includes browser/network overhead. Status progress uses page counts or batch counts, not invented generation percentages. Cached results display original timings with a cache note. Cost is not estimated without current pricing.

## Known engineering constraints

No durable sessions, per-user identity, server quotas or distributed rate limits. API access token is a private-workspace MVP gate. Readiness for public deployment requires additional authentication, abuse controls, a retention policy, production observability and content evaluation.

## Reference dashboard and telemetry details

Student view presents eight main cards plus revision notes and PDF Q&A. Behind the RAG shows Validate, Decode, OCR, Structure, Chunk, Embed, Index and Generate. OCR uses browser-local Tesseract on printed image-only pages; embedding is optional; the index is browser memory rather than Qdrant. Preparation records validation, extraction, heading structure, chunking and source-lookup construction using separate performance timers. Generation durations come from the last measured request. Model files may be browser-cached; document vectors and results remain session-memory only.

## Browser-local translation

No provider API key is required. English source aids → Tamil / Hindi using q8 NLLB in a dedicated web worker. Tamil questions → English before retrieval. Original page references, formulas and quoted excerpts remain exact. Translation errors are visible and cancellable; cached models depend on browser storage. First download is approximately 900 MB plus runtime/tokenizer files. Local mode translates selected source content, not new teacher explanations. Intended for English PDFs; technical translation needs review.

Modules: `src/lib/translation.js` (worker lifecycle), `translation-core.js` (structured provenance-safe traversal and bounded segments), `src/workers/translation.worker.js` (download, WASM translation, sequential queue and in-memory translation cache). Cache strings are cleared on document replacement/removal; model files may remain in browser cache. Model pinned to Xenova/nllb-200-distilled-600M at revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea, CC-BY-NC-4.0, based on Meta NLLB-200.

Physics subject mode uses a small project-authored terminology glossary for exact labels, electrical context for the ambiguous word charge, and Tamil charge/fee normalization. It does not establish sentence accuracy. Sentence-level segmentation prevents short paragraphs being silently condensed into one model output. Browser tests mock inference; live smoke outputs are recorded separately.

## Blank pages and normal reading layouts

PDF extraction retains every original page number. Pages with selectable text are included even if short. No-text pages are rendered locally into a 256-pixel preview: a white preview is treated as blank; visible marks and unknown previews can trigger OCR when enabled; failed/noisy recognition requires manual review. Blank pages do not create chunks or OCR warnings. Preview classification is a heuristic, not OCR or diagram interpretation. `pageReport` supports per-page coverage and original-page inspection.

StudyGraph starts in responsive Fit page mode, uses ResizeObserver for container width, and resets manual zoom on new outputs. The full diagram uses normal document scrolling rather than a vertically constrained canvas. TopicReader shows only the selected topic: a short definition, at most three key ideas, optional formula, and a roadmap self-check. Original passages are opened using citations; the complete book is not repeated below diagrams. Optional zoom remains available for diagram details. Architecture diagrams fit their container too.

## Final study features

Visual flashcards use source-linked code-native SVG concept diagrams with reveal controls, individual SVG image downloads and printing. MCQ quizzes require four unique options and one matching answer in every mode. Source-only MCQs are exact-wording recall questions (maximum 10), not inferred conceptual exam questions. Conceptual demo MCQs are manually authored; cloud MCQs depend on model grounding. Selected options are scored after submission; explanation and evidence remain visible.

Hindi is available alongside English and Tamil. Local Hindi uses hin_Deva in the existing NLLB model; Hindi questions are translated to English before retrieval. Cloud input accepts Hindi and requests Hindi explanations. Original quotes, formulas and citations stay unchanged. When option translations collapse to identical words, original option labels disambiguate them and the correct answer follows its original option index.


## Focused diagrams — September 2026 update

`graph-content.js` separates graph-specific content selection from full study notes. All source chunks are considered, repeated topic labels and exact sentences are merged, activity/footer boilerplate is filtered, and up to three short complete facts are selected per topic using topic overlap and definition/formula/unit signals. This is heuristic source extraction, not an LLM paraphrase or exhaustive chapter summary. Source IDs are preserved, including duplicates spanning pages. If only long sentences exist, one complete source sentence is retained instead of cutting its conditions or negations.

Chunk text now retains original line breaks and word-overlap boundaries, allowing standalone headings to be excluded from graph explanations. A page title that is itself a short paragraph is never deleted as a heading. Mind-map branches use short category names; code-native SVG nodes have professional sans-serif fonts and content-aware heights. Six topics appear per graph page. The selector and node inspector show only one selected topic. Original source content requires opening a citation.

Cloud Groq generation remains optional and requires server credentials. Its graph prompt requests at most three essential facts, specific roadmap objectives/self-checks, and concise named concepts. Server validation rejects paragraph dumps: topic title <= 70 characters, body <= 240, point <= 190, maximum three key points; mind maps maximum three subtopics with titles <= 45 and two points each; roadmap objectives/checkpoints <= 180. These shape checks do not prove factual grounding. Browser-local translation remains experimental.


## OCR implementation

`ocr-quality.js` defines printed-language models (`eng`, `tam`, `hin`), a minimum recognition score of 45 and minimum text checks (eight Unicode letters and two tokens), cancellable bounded waits, and synchronous worker-creation capture. The recognition score is an engine diagnostic, not calibrated factual confidence. `ocr.js` lazily loads Tesseract.js 7.0.0, starts one worker per document, reuses it across scanned pages and terminates it on completion/error/cancellation, including initialization. The constructor capture is confined to the synchronous public `createWorker` invocation and immediately restores the browser constructor.

`pdf.js` extracts text, renders a 256-pixel no-text-page preview, skips white blank pages, and recognizes visible/unknown image-only pages. OCR renders up to a 2400-pixel longest edge, at scale up to three. Initialization timeout is 120 seconds; each recognition timeout is 90 seconds. Canvas dimensions are reset after each page. Successful text sets Page/Chunk `origin: ocr` and records an OCR diagnostic score; failed text never enters chunks. Scanned pages retain original page numbers. Decode and OCR timings are recorded separately.

The self-hosted worker script is included in Vite assets. Core WASM is pinned to the Tesseract.js-core 7.0.0 jsDelivr directory; language data uses the verified `@tesseract.js-data/<lang>@1.0.0/4.0.0_best_int` directory. Downloads are public static files, not document uploads. Language caching uses Tesseract's browser storage. OCR transcriptions flow through the same chunking, retrieval and study tools; the source modal tells readers to compare them with the original scan. Textbook quote validation checks recognized evidence text, not the original image, and cannot prove OCR accuracy. Text-layer pages containing additional image text are not automatically OCRed; table structure, handwriting and diagram semantics remain unsupported.


## Multi-format local ingestion

| Upload | Reader and source references | Limits |
|---|---|---|
| PDF | PDF.js; original pages; local printed OCR | 200 pages; diagrams and handwriting require review |
| DOCX | Bounded ZIP/XML paragraph reader | Document paragraph order, not Word pagination; body text only |
| XLS / XLSX / CSV / TSV | SheetJS 0.20.3; named sheets and row text | 200 sheets, 100,000 cells per sheet; stored formula values only; no macro execution |
| PPTX | ZIP/XML, presentation relationship order | Original slide numbers; slide text only; no speaker notes/charts/image interpretation |
| PPT | Compound-file text atoms | Legacy storage order may differ from slideshow order; convert to PPTX for exact slide order |
| JPG / JPEG / PNG / GIF / GIFF / WebP / BMP | Browser image decoding + Tesseract printed OCR | English/Tamil/Hindi; first GIF frame only; 40 megapixels; longest OCR side 2400 pixels |
| XML | Safe native XML parsing; leaf text and tag labels | DTD/entities rejected; attributes are not indexed |
| TXT / MD / JSON | UTF-8 text; JSON syntax validation | Source document text order; no rendered layout |
| DOC | Conversion instruction | Save as DOCX or PDF. Server conversion is not enabled. |

All supported readers run locally with a 20 MB file limit. New non-PDF readers also cap extracted text at 2 million characters. Office archives have a 40 MB expanded-size cap and 10 MB per entry. Source modal downloads the original Office/text file and shows original images; it does not embed Office files as PDFs. OCR downloads public models but does not upload image contents. AI mode remains an optional, separately configured cloud path.


## Animated system walkthrough

Open **Behind the RAG** to explore four selectable flows: document preparation, question answering, study-material creation, and MCP/development. Play/pause, playback speed, manual next-step and step selection control the illustration. Playback starts paused and reduced-motion preferences disable moving effects. Each step exposes its purpose, tool, input, output, validation and limitations; source passages and active session/vector/cloud status come from actual application state. Playback never invokes OCR, model inference, MCP or deployment. Timing cards and request traces remain measured values; illustration speed is not job latency.

`RagWalkthrough.jsx` owns only presentation state (path, selected step, play state, speed). `flow-model.js` derives educational step contracts from the document, vectors, request trace, selected mode and cloud configuration. Timers are cleared on pause/path changes/unmount; the walkthrough exposes keyboard buttons, current-step markers and a progressbar. CSS packets and highlights indicate the sequence, with a vertical flow on narrower screens.

The MCP path explains coding-agent tool requests, GitHub integration/repository reads, structured results and release verification. The review Skill is an instruction workflow; application libraries run directly in the browser. Git and Vercel CLIs commit/push/deploy outside student question answering. Optional Groq/E5/NLLB paths, memory-only indexing and future Qdrant/reranking are explicitly labelled.
