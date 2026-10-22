import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api';
import { imageResolverHandler } from './src/server/imageResolver';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API and Image routing
app.use('/api', apiRouter);
app.get('/i/:id', imageResolverHandler);

// Setup dev Vite server or production static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    // In Vite 8 with middlewareMode, attaching httpServer to both ws and hmr is required
    // so Vite does not default port to 24678 (which causes WebSocket connection rejections).
    // With ws.server set to httpServer, hmrPort is null, allowing WebSocket connections to
    // multiplex over the primary HTTP server and preventing unhandled rejections if closed.
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: {
          server: httpServer,
          overlay: false,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Image To URL server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
