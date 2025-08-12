// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

// @ts-ignore
import { registerRoutes } from '../dist/server/server/routes.js';

let app: express.Application;

async function initApp() {
  if (!app) {
    app = express();
    app.set("trust proxy", 1);
    app.disable("x-powered-by");
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 10000 }));
    
    // Initialize routes
    await registerRoutes(app);
    
    // Serve static files in production
    // @ts-ignore
    const { serveStatic } = await import('../dist/server/server/vite.js');
    serveStatic(app);
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await initApp();
    server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}