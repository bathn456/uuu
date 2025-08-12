#!/usr/bin/env node
import { spawn } from 'child_process';

// Start the production server
const server = spawn('node', ['dist/server/server/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code);
});