# Production deployment

- Public application: https://ai-easystudy.vercel.app
- Repository: https://github.com/arunocpk8s/AI-Easystudy
- Vercel project: `ocpk8s/ai-easystudy`
- GitHub repository connected to Vercel; production branch: `main`.
- Initial production deployment completed on 17 September 2026.

## Release runbook

1. Run `npm ci`, `npm test`, `npm run evaluate`, and `npm run build`.
2. Run `npx playwright test` for desktop and mobile behavior.
3. Commit reviewed changes and push `main` to the connected GitHub repository.
4. Verify the Vercel deployment is ready and check the public application without signing in.
5. For an explicit CLI production deployment, run `npx vercel --prod --yes --scope ocpk8s` from this linked project.

## Configuration and limits

PDF extraction, source-based study materials, graphical flashcards, MCQ practice, diagrams, and the bilingual demo work without cloud credentials. Local Tamil/Hindi translation downloads approximately 900 MB of model weights on first use and remains experimental. A real browser Hindi smoke check translated a basic sentence and question in 194 seconds including initial model loading; this is not a translation-quality benchmark.

Cloud explanations are not enabled in this deployment. To enable them, set `GROQ_API_KEY` and `STUDY_ACCESS_TOKEN` in Vercel production environment variables, optionally set `GROQ_MODEL`, redeploy, and enter the workspace access token in the application Settings. Keep these values out of Git. Scanned-page OCR and diagram interpretation are not implemented.

See `evaluation/results/production-smoke.json` and `public/docs/VALIDATION.md` for actual validation scope, and `public/docs/RUNBOOK.md` for local setup and operational steps.
