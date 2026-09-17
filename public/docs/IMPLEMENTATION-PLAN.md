# Implementation plan

## Sequence

1. Define requirements, trust boundaries and supported PDF limits.
2. Choose Vercel-compatible dashboard architecture.
3. Build local extraction and page-aware chunking.
4. Add BM25 retrieval and source viewer.
5. Add extractive tools and protected AI generation endpoint.
6. Add optional multilingual embeddings and hybrid fusion.
7. Build flashcard reveal, self-check quiz and Markdown export.
8. Expose processing evidence, timings and token usage.
9. Validate pipeline, API contracts and browser workflows.
10. Prepare HLD, LLD, runbook, tool inventory and comparison.
11. Deploy and smoke-test when Vercel authentication is available.

## Repository structure

```text
api/                 Stateless Vercel functions
src/                 React UI and processing modules
public/docs/         Full project documents also served by the app
tests/               Node tests, browser tests and PDF fixture
scripts/             Evaluation and fixture generation
evaluation/          Golden questions and recorded results
.agents/skills/      Repeatable RAG review instructions
```

## Next milestones

Teacher-reviewed CBSE test set; live model evaluation; Tamil retrieval tests; OCR; persistent accounts/documents; subject syllabus ingestion; cross-section synthesis; graph interaction; hybrid versus baseline comparison; cost budgets and distributed rate limits.
