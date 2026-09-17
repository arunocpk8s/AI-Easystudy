# Lessons learned

- A source-linked assistant needs page provenance before generation; citations cannot be reliably reconstructed afterward.
- Whole-book summaries and question answering are different tasks. Whole-document coverage requires section processing rather than ordinary top-K retrieval.
- A useful no-key fallback must be honestly labelled. Extracted sentences are not proof of LLM reasoning or semantic summarization.
- Ranking scores are not answer confidence. Source-ID checks are not factual grounding checks.
- Tamil output and Tamil retrieval are separate capabilities and need separate tests.
- Browser-local processing simplifies private uploads but introduces model-download, memory and refresh-lifecycle constraints.
- Quiz self-assessment is more honest than unreliable exact-string grading of generated short answers.
- Skills provide a repeatable quality workflow; MCP provides actual external tool access. Neither should be claimed based only on configuration files.
- Vercel-ready source is different from a verified live deployment.

Next: expand the original fixture into teacher-reviewed real textbook questions, validate AI/Tamil output, and address OCR, identity, persistence and quotas before public enterprise use.
