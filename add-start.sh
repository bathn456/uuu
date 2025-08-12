#!/bin/bash

# Add start script to package.json for Render deployment
echo "Adding start script to package.json..."

# Create temporary package.json with start script
cat > temp-package.json << 'EOF'
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "start": "node start-production.js",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && tsc -p tsconfig.server.json",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
EOF

echo "Start script added successfully!"
echo "Command: node start-production.js"