import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import study from './api/study.js';
import status from './api/status.js';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/status', (req, res) => status(req, res));
      server.middlewares.use('/api/study', async (req, res) => {
        let body = ''; let tooLarge = false;
        try {
          for await (const part of req) { body += part; if (body.length > 150000) { tooLarge = true; break; } }
          if (tooLarge) { res.statusCode = 413; return res.end(JSON.stringify({error:'Request too large.'})); }
          req.body = body ? JSON.parse(body) : {};
          await study(req, res);
        } catch { res.statusCode = 400; res.end(JSON.stringify({error:'Invalid JSON request.'})); }
      });
    }
  }], build: {chunkSizeWarningLimit: 1200} };
});
