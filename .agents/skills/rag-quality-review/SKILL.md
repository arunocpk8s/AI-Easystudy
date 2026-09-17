---
name: rag-quality-review
description: Review this study assistant's PDF provenance, retrieval coverage, generated study schemas, and evidence-linked outputs after changes to its RAG pipeline.
---

# Study content review

Read `public/docs/REQUIREMENTS.md` and `public/docs/LLD.md` before reviewing pipeline changes.

Preserve PDF page provenance throughout chunking and generation. Citation validation proves ID membership, not factual support; inspect actual supporting passages when assessing grounding.

Question answering should use relevant retrieved evidence. Whole-document tools must cover all readable chunks in bounded batches, rather than summarize only top-K retrieval results. Explain partial extraction and feature-specific caps visibly.

Distinguish extractive study aids from AI-generated explanations. Do not describe lexical scores as confidence, generated practice as official exam predictions, or inferred confusion points as verified common misconceptions.

Run `npm test`, `npm run evaluate`, and `npm run build` after pipeline changes. For UI behavior changes, run the relevant Playwright cases. Record concrete failures and the scope of verification in `public/docs/VALIDATION.md`. Do not claim live provider, OCR, semantic retrieval, or deployment verification from mock tests.
