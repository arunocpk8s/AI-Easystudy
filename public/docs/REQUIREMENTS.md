# Requirements — Study Atlas

## Problem, users and scope

Students struggle to navigate long documents, distinguish related concepts, and turn reading into recall practice. Study Atlas transforms uploaded PDFs into source-linked learning aids, with a visible evidence trail.

Primary users: Class 11/12 students. Secondary users: teachers checking output and project reviewers examining the RAG implementation. PDF content is chosen by the learner; class and subject are not hard-coded.

MVP accepts printed text-based and scanned PDFs of up to 20 MB and 200 pages. English extractive materials preserve source language; AI outputs support English, Tamil or Hindi. Reading extraction is not guaranteed for every PDF. Password-protected, damaged and scanned PDFs may fail or produce warnings. Diagram interpretation, handwritten recognition, persistent storage and multi-user accounts are outside the current implementation.

## Functional requirements and acceptance criteria

| ID | Requirement | Acceptance |
|---|---|---|
| FR01 | Upload and extract PDF locally | Two-page fixture produces readable, page-linked passages |
| FR02 | Preserve page provenance | Every chunk has an ID and PDF page |
| FR03 | Create short notes and topic summaries | Items link to supplied evidence; AI and extractive labels differ |
| FR04 | Create a mind map | Connected document/topic/idea nodes support zoom, SVG export and source inspection |
| FR05 | Create flashcards | Answers are hidden until revealed |
| FR06 | Create practice question types | Generated practice is not called official exam prediction |
| FR07 | Highlight potential confusion points | Inference is labelled; teacher validation is required |
| FR08 | Create short-answer/MCQ/cloze quizzes | Answers appear only after checking; grading is self-assessment |
| FR09 | Create revision notes | Selected essential passages remain traceable |
| FR10 | Create document roadmap | Connected step diagram supports reviewed state; no claim of full subject coverage or verified prerequisites |
| FR11 | Answer questions | Retrieve passages; AI uses evidence; keyword misses show insufficient evidence |
| FR12 | Inspect sources | Passage preview and original PDF link target the PDF page |
| FR13 | Visualize execution | Show actual stages, evidence and measured durations |
| FR14 | Remove document | Clear document, vectors, results, source state and object URL |
| FR15 | Export study materials | Download Markdown with source IDs and page references |
| FR16 | Optional hybrid search | Enable browser-local multilingual vectors plus keyword ranking |
| FR17 | Reuse results | Cache by feature, mode and language within the current document session |

## Non-functional requirements

- Keep provider keys server-side; require a configured access token for AI requests.
- Do not maintain a global server document collection. A session uses its own document state.
- Validate file limits, evidence contracts, JSON output and citation membership.
- Treat PDF text as untrusted evidence, not executable instructions.
- Display incomplete extraction, provider errors and unsupported modes explicitly.
- Measure performance rather than promise a fixed latency.
- Responsive keyboard-accessible controls and readable mobile layout.
- No content or access tokens in application logs.

## Validation boundary

Valid IDs do not prove factual grounding. A teacher should inspect correctness, supported claims, scientific units, formula extraction, Tamil translation and topic coverage. The current golden fixture measures English keyword retrieval only.

## Reference layout acceptance

Student view: upload area, class/subject/language selectors, eight main tool cards, revision notes and an Ask this PDF panel. Behind the RAG: eight processing stages, measured durations, stage availability and evidence details. Graphical outputs must have actual connecting edges, readable node labels and source navigation, not only lists of cards.

## Browser-local translation

No provider API key is required. English source aids → Tamil / Hindi using q8 NLLB in a dedicated web worker. Tamil questions → English before retrieval. Original page references, formulas and quoted excerpts remain exact. Translation errors are visible and cancellable; cached models depend on browser storage. First download is approximately 900 MB plus runtime/tokenizer files. Local mode translates selected source content, not new teacher explanations. Intended for English PDFs; technical translation needs review.

Modules: `src/lib/translation.js` (worker lifecycle), `translation-core.js` (structured provenance-safe traversal and bounded segments), `src/workers/translation.worker.js` (download, WASM translation, sequential queue and in-memory translation cache). Cache strings are cleared on document replacement/removal; model files may remain in browser cache. Model pinned to Xenova/nllb-200-distilled-600M at revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea, CC-BY-NC-4.0, based on Meta NLLB-200.

## Final study features

Visual flashcards use source-linked code-native SVG concept diagrams with reveal controls, individual SVG image downloads and printing. MCQ quizzes require four unique options and one matching answer in every mode. Source-only MCQs are exact-wording recall questions (maximum 10), not inferred conceptual exam questions. Conceptual demo MCQs are manually authored; cloud MCQs depend on model grounding. Selected options are scored after submission; explanation and evidence remain visible.

Hindi is available alongside English and Tamil. Local Hindi uses hin_Deva in the existing NLLB model; Hindi questions are translated to English before retrieval. Cloud input accepts Hindi and requests Hindi explanations. Original quotes, formulas and citations stay unchanged. When option translations collapse to identical words, original option labels disambiguate them and the correct answer follows its original option index.


## Focused graph acceptance

Mind maps and roadmaps use professional sans-serif fonts. Graphs show concise concepts and necessary facts rather than paragraph labels. Source-based selection considers all chunks but displays only up to three essential facts per topic; this is not complete chapter coverage. Only a selected topic's essentials appear beneath the diagram; full textbook passages open through citations. Diagrams fit the normal page, preserve source links, and resize nodes to avoid clipping.


## Local OCR acceptance

Image-only pages support browser-local printed-text OCR in English, Tamil and Hindi. PDF printed language is independent of preferred output language and is selected before uploading. OCR may be disabled. Blank pages skip recognition; existing text layers are retained without OCR. Recognized passages retain their original page numbers and are labelled as OCR transcriptions. Low-scoring/noisy results and failed pages are excluded and reported; other readable pages remain usable. A document with no indexed text still exposes page coverage and warnings. Processing is cancellable and workers/canvases are released. Recognition is heuristic and must not imply handwriting, diagram understanding, exact equation recognition or exhaustive mixed-page image coverage.


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

All supported readers run locally, with 20 MB file and 2 million extracted-character limits. Office archives have a 40 MB expanded-size cap and 10 MB per entry. Source modal downloads the original Office/text file and shows original images; it does not embed Office files as PDFs. OCR downloads public models but does not upload image contents. AI mode remains an optional, separately configured cloud path.
