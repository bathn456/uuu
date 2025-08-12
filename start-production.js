#!/usr/bin/env node

// Production startup script for Render deployment
// Uses ES modules syntax for compatibility with package.json "type": "module"

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Deep Learning Platform in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Path to the compiled server
const serverPath = join(__dirname, 'dist', 'server', 'index.js');

console.log(`📂 Server path: ${serverPath}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`🔌 Port: ${process.env.PORT || 10000}`);

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || 10000, // Render uses PORT env var
  }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`📊 Server exited with code: ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});