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

Mind-map implementation: connected SVG document root → topic branches → up to two source-linked evidence snippets per topic. Repeated topic titles are grouped without losing sources. The roadmap uses a connected document-order step diagram with a per-session reviewed state. Graphs show six topics per page with previous/next controls, zoom, keyboard-selectable nodes, a full-text source inspector and SVG export. The diagram is scrollable rather than draggable. No verified prerequisite dependency network is inferred. Quiz self-assessment avoids unreliable exact-string grading. AI quizzes may include multiple-choice options; choices must be distinct and the answer must exactly match one option. Extractive quizzes remain cloze questions.

## Telemetry

Use `performance.now()` for local durations and server generation elapsed time. Total request includes browser/network overhead. Status progress uses page counts or batch counts, not invented generation percentages. Cached results display original timings with a cache note. Cost is not estimated without current pricing.

## Known engineering constraints

No durable sessions, per-user identity, server quotas or distributed rate limits. API access token is a private-workspace MVP gate. Readiness for public deployment requires additional authentication, abuse controls, a retention policy, production observability and content evaluation.

## Reference dashboard and telemetry details

Student view presents eight main cards plus revision notes and PDF Q&A. Behind the RAG shows Validate, Decode, OCR, Structure, Chunk, Embed, Index and Generate. OCR is explicitly unavailable; embedding is optional; the index is browser memory rather than Qdrant. Preparation records validation, extraction, heading structure, chunking and source-lookup construction using separate performance timers. Generation durations come from the last measured request. Model files may be browser-cached; document vectors and results remain session-memory only.

## Browser-local translation

No provider API key is required. English source aids → Tamil using q8 NLLB in a dedicated web worker. Tamil questions → English before retrieval. Original page references, formulas and quoted excerpts remain exact. Translation errors are visible and cancellable; cached models depend on browser storage. First download is approximately 900 MB plus runtime/tokenizer files. Local mode translates selected source content, not new teacher explanations. Intended for English PDFs; technical translation needs review.

Modules: `src/lib/translation.js` (worker lifecycle), `translation-core.js` (structured provenance-safe traversal and bounded segments), `src/workers/translation.worker.js` (download, WASM translation, sequential queue and in-memory translation cache). Cache strings are cleared on document replacement/removal; model files may remain in browser cache. Model pinned to Xenova/nllb-200-distilled-600M at revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea, CC-BY-NC-4.0, based on Meta NLLB-200.

Physics subject mode uses a small project-authored terminology glossary for exact labels, electrical context for the ambiguous word charge, and Tamil charge/fee normalization. It does not establish sentence accuracy. Sentence-level segmentation prevents short paragraphs being silently condensed into one model output. Browser tests mock inference; live smoke outputs are recorded separately.
