import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { f1Router } from './src/backend/presentation/F1ApiRouter.js';
import { SyncService } from './src/backend/application/SyncService.js';
import { WebSocketServer } from 'ws';
import { LiveTimingEngine } from './src/backend/application/LiveTimingEngine.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json());

// Mount the API Router first
app.use('/api', f1Router);

// Background initialization & auto-sync
const syncService = new SyncService();
console.log('⚡ Initializing Race Tech Fusion application data...');
syncService.syncAll('current').then(() => {
  console.log('✅ Initial database sync trigger successful.');
}).catch(err => {
  console.error('⚠️ Initial database sync triggered with error:', err);
});

// Configure Vite middleware or serve static files
const isProduction = process.env.NODE_ENV === 'production';

async function setupServer() {
  if (!isProduction) {
    console.log('🔄 Running in DEVELOPMENT mode, mounting Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('📦 Running in PRODUCTION mode, serving static files from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Race Tech Fusion active and live at http://localhost:${PORT}`);
  });

  // Attach state-authoritative live WebSocket server
  const wss = new WebSocketServer({ server });
  const liveTimingEngine = LiveTimingEngine.getInstance();

  wss.on('connection', (ws) => {
    console.log('🔌 New race dashboard client connected to physical server gateway.');
    liveTimingEngine.addClient(ws);

    ws.on('close', () => {
      console.log('🔌 Client disconnected from race server gateway.');
      liveTimingEngine.removeClient(ws);
    });

    ws.on('error', (err) => {
      console.warn('⚠️ WebSocket client connection error:', err);
    });
  });
}

setupServer().catch((error) => {
  console.error('💥 Failed to start Express full-stack server:', error);
});
