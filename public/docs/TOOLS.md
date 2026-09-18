# Tools, Skills and MCP

## Application tools

| Tool | Use | Why |
|---|---|---|
| React | Two-view dashboard, document/session state, study tools | Component-based responsive UI |
| Native SVG | Connected mind maps and roadmaps with export | Code-native graphical output, no image generation or graph service needed |
| Vite | Dev server and production assets | Suitable for Vercel static frontend |
| PDF.js | Local text extraction and scanned-page rendering with page references | Official Mozilla PDF processing library |
| Tesseract.js 7.0.0 | Browser-local printed-page OCR | English, Tamil and Hindi without cloud API keys |
| Transformers.js | Optional multilingual embeddings | Browser-local semantic retrieval |
| BM25 implementation | No-download keyword baseline | Transparent and testable retrieval |
| Reciprocal rank fusion | Combine keyword and semantic ranks | No assumption that raw scores share a scale |
| Groq API | AI study generation | Server-side structured chat completion |
| Zod | Request and result schemas | Reject malformed output and unknown source IDs |
| Lucide | UI icons | Consistent lightweight visual system |
| Node test runner | Pipeline/API tests | Small test setup |
| Playwright | Browser interaction and viewport validation | Validate complete student workflows |
| pdf-lib | Original test PDF creation | Deterministic extraction fixture |
| Git | Local history | Reviewable development stages |
| Vercel | Intended frontend/API hosting | Vite frontend and stateless functions |

## MCP integration used

GitHub MCP was used through its read-only repository fetch capability to read Mozilla's official `examples/node/getinfo.mjs` and verify the text-extraction and page-loop approach.

Resource: https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs

This is real external repository access through MCP. It is not evidence of creating a GitHub repository, pushing commits or deploying. Local Git operations use the shell.

Vercel integration was discovered through the plugin directory but was not connected at discovery. Deployment requires a confirmed connection or authenticated CLI; current deployment verification is recorded in VALIDATION.md.

## Skills

The available skill-creator skill guided creation of `.agents/skills/rag-quality-review/SKILL.md`. The project skill specifies page provenance, whole-document coverage, truthful extractive/AI labels and validation boundaries. It is invoked for the final pipeline review and its results are recorded in VALIDATION.md. The skill is repository-local; no global machine skill installation was performed.

The plugin-management skill guided discovery of the requested Vercel integration without treating an unconnected plugin as an active tool.

## Reference documentation

- PDF.js: https://mozilla.github.io/pdf.js/getting_started/
- Groq chat completion: https://console.groq.com/docs/api-reference
- Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- Vercel CLI: https://vercel.com/docs/cli/deploy

## Changes from the original suggested stack

React replaces Streamlit for the requested dashboard and Vercel page. PDF.js replaces Python parsing to keep files local. Transformers.js replaces Python Sentence Transformers for optional local embeddings. A browser-memory index replaces Qdrant for this private prototype. LangChain is not used because the explicit pipeline is small enough to implement directly. These choices simplify deployment but do not provide enterprise persistence, identity or scalable ingestion.

- Multilingual E5 model and required input prefixes: https://huggingface.co/intfloat/multilingual-e5-small

## Browser-local translation

No provider API key is required. English source aids → Tamil / Hindi using q8 NLLB in a dedicated web worker. Tamil questions → English before retrieval. Original page references, formulas and quoted excerpts remain exact. Translation errors are visible and cancellable; cached models depend on browser storage. First download is approximately 900 MB plus runtime/tokenizer files. Local mode translates selected source content, not new teacher explanations. Intended for English PDFs; technical translation needs review.

Modules: `src/lib/translation.js` (worker lifecycle), `translation-core.js` (structured provenance-safe traversal and bounded segments), `src/workers/translation.worker.js` (download, WASM translation, sequential queue and in-memory translation cache). Cache strings are cleared on document replacement/removal; model files may remain in browser cache. Model pinned to Xenova/nllb-200-distilled-600M at revision 261c31d1a5732c67cdd16d80e8d6088507c7ccea, CC-BY-NC-4.0, based on Meta NLLB-200.

Physics subject mode uses a small project-authored terminology glossary for exact labels, electrical context for the ambiguous word charge, and Tamil charge/fee normalization. It does not establish sentence accuracy. Sentence-level segmentation prevents short paragraphs being silently condensed into one model output. Browser tests mock inference; live smoke outputs are recorded separately.

## Final study features

Visual flashcards use source-linked code-native SVG concept diagrams with reveal controls, individual SVG image downloads and printing. MCQ quizzes require four unique options and one matching answer in every mode. Source-only MCQs are exact-wording recall questions (maximum 10), not inferred conceptual exam questions. Conceptual demo MCQs are manually authored; cloud MCQs depend on model grounding. Selected options are scored after submission; explanation and evidence remain visible.

Hindi is available alongside English and Tamil. Local Hindi uses hin_Deva in the existing NLLB model; Hindi questions are translated to English before retrieval. Cloud input accepts Hindi and requests Hindi explanations. Original quotes, formulas and citations stay unchanged. When option translations collapse to identical words, original option labels disambiguate them and the correct answer follows its original option index.


OCR implementation references: [Tesseract.js API](https://github.com/naptha/tesseract.js/blob/v7.0.0/docs/api.md) and [local installation](https://github.com/naptha/tesseract.js/blob/v7.0.0/docs/local-installation.md). Tesseract.js/core are Apache-2.0; the verified English/Tamil/Hindi language-data distribution packages report MIT licensing. The package lock pins runtime dependencies and OCR static download paths explicitly pin core 7.0.0 and language packages 1.0.0. OCR images are processed on the student's device; jsDelivr requests download code and language files.


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
