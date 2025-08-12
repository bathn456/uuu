#!/usr/bin/env node

// Production startup script for Render deployment
// This file ensures the server starts correctly in production

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Deep Learning Platform in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Path to the compiled server
const serverPath = path.join(__dirname, 'dist', 'server', 'server', 'index.js');

console.log(`📂 Server path: ${serverPath}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

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