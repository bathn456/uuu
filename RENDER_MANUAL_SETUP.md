# Render Manual Setup Guide

## Current Issue:
Render free tier is ignoring our `render.yaml` configuration and defaulting to `yarn start`.

## SOLUTION FOUND:
The issue is that `package.json` doesn't have a `start` script. Yarn documentation shows it looks for this script.

## Quick Fix:
Add this to package.json scripts section:
```json
"start": "node start-production.js"
```

## Solution Steps:

### 1. Manual Dashboard Configuration
Go to your Render service dashboard:

**Settings → Build & Deploy → Edit**

Set these values manually:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node start-production.js`

### 2. Environment Variables
Add these in **Settings → Environment**:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render default)
- `DATABASE_URL` = (your PostgreSQL connection string)

### 3. Redeploy
After making these changes:
- Click **Manual Deploy**
- Select latest commit
- Deploy

## Why This Happens:
- Render free tier doesn't read `render.yaml` configurations
- It defaults to auto-detected commands
- Manual setup in dashboard overrides defaults

## Expected Result:
✅ Build: 3.79s (1730 modules) - Already working  
✅ Server: Will start on correct port with start-production.js  
✅ Database: PostgreSQL connection ready  

## Files Ready:
- ✅ `start-production.js` - Production startup script
- ✅ Server fixed to listen in production mode
- ✅ All module imports resolved
- ✅ Vercel files removed