# Render Deployment Guide

## Hızlı Deployment Adımları:

1. **GitHub'a Push Edin:**
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push
   ```

2. **Render Dashboard'a Gidin:**
   - https://render.com
   - "New" → "Web Service"

3. **Repository Bağlayın:**
   - GitHub repository'nizi seçin
   - Branch: `main`

4. **Build & Start Commands:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server/server/index.js`

5. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Render PostgreSQL connection string)

6. **Free PostgreSQL Database:**
   - Render Dashboard → "New" → "PostgreSQL"
   - Database Name: `deeplearning`
   - Copy connection string to `DATABASE_URL`

## Render Avantajları:
- ✅ Free tier: 750 saat/ay
- ✅ Otomatik HTTPS
- ✅ GitHub integration
- ✅ PostgreSQL database dahil
- ✅ Zero-config deployment

## Alternative Start Commands:
If the main command doesn't work, try these in Render settings:
- `node dist/server/server/index.js` (production build)
- `tsx server/index.ts` (direct TypeScript execution)
- `npm run dev` (development mode - not recommended for production)

## Troubleshooting:
- Build successful ✅ (3.36s, 1730 modules)
- Issue: Missing start script
- Solution: Use direct node command to run compiled server