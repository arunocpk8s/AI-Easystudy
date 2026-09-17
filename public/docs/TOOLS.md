# Tools, Skills and MCP

## Application tools

| Tool | Use | Why |
|---|---|---|
| React | Dashboard, document/session state, study tools | Component-based responsive UI |
| Vite | Dev server and production assets | Suitable for Vercel static frontend |
| PDF.js | Local extraction with page references | Official Mozilla PDF processing library |
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
