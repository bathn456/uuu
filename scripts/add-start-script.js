#!/usr/bin/env node

// Script to safely add start command to package.json for Render deployment
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add start script if it doesn't exist
  if (!packageJson.scripts.start) {
    packageJson.scripts.start = 'node start-production.js';
    
    // Write back to package.json with proper formatting
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✅ Added start script to package.json');
    console.log('📄 Start command: node start-production.js');
  } else {
    console.log('⚠️  Start script already exists');
  }
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
  process.exit(1);
}