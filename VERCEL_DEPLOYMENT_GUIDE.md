# CourseScope Vercel Deployment Guide

This guide walks you through deploying both the frontend and backend to Vercel.

## Prerequisites

- Vercel account (free: https://vercel.com)
- GitHub account with your repository pushed
- Git installed locally

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Hosting                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + Vite)          Backend (Python)         │
│  - Handles UI/UX                  - Serverless Functions   │
│  - Makes API requests             - Database queries       │
│  - Proxies to backend API         - API routes             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Prepare Your GitHub Repository

Ensure your project is pushed to GitHub with the correct structure:

```
coursescope/
├── api/                    # Vercel serverless backend
│   ├── _db.py             # Database utilities
│   ├── majors.py          # GET /api/majors
│   ├── courses.py         # GET /api/courses
│   ├── course.py          # GET /api/course?code=...
│   ├── eligible.py        # POST /api/eligible
│   ├── grades.py          # GET /api/grades?code=...
│   ├── requirements.txt    # Python dependencies
│   ├── uic_courses.db     # SQLite database
│   └── vercel.json        # (Optional - root level preferred)
├── backend/               # Local Flask development (not deployed)
├── src/                   # Frontend React code
├── vite.config.js         # Frontend build config
├── vercel.json            # Root level deployment config
├── package.json           # Frontend dependencies
└── README.md
```

## Step 2: Create Root-Level vercel.json

Update your root `vercel.json` file to configure both backend and frontend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

## Step 3: Configure Frontend Build

Ensure your `vite.config.js` is production-ready:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
```

Your `src/App.jsx` already has:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "/api";
```

This works perfectly - locally it uses `/api` (proxied to backend), in production it uses the environment variable.

## Step 4: Add Build Script

Update your `package.json` to include a build script:

```json
{
  "scripts": {
    "dev": "vite",
    "backend": "./start-backend.sh",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

## Step 5: Deploy Backend to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy backend:
   ```bash
   cd api
   vercel --prod
   ```

3. Note the backend URL (e.g., `https://coursescope-api.vercel.app`)

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository
4. Select the `api` folder as the source
5. Click "Deploy"
6. Note the deployed URL

## Step 6: Configure Frontend Environment Variables

In Vercel Dashboard for your frontend project:

1. Go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.vercel.app/api`
   - **Production**: ✓

## Step 7: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

```bash
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository
4. Select the root folder (or automatic detection)
5. Set **Build Command**: `npm run build`
6. Set **Output Directory**: `dist`
7. Add environment variables (VITE_API_URL)
8. Click "Deploy"

## Step 8: Verify Deployment

1. Visit your frontend URL (e.g., `https://coursescope.vercel.app`)
2. Open browser DevTools (F12)
3. Check the Network tab - API requests should go to your backend URL
4. Verify data loads correctly

## Troubleshooting

### "API not found" or 404 errors

- Check that `VITE_API_URL` environment variable is set correctly
- Ensure backend is deployed and running
- Check CORS settings in `api.py`:
  ```python
  CORS(app, resources={r"/api/*": {"origins": "*"}})
  ```

### Database not found

- Ensure `uic_courses.db` is in the `/api` folder
- Run scrapers locally if database is empty

### Built-in proxy not working

- The proxy in `vite.config.js` only works for local development
- Production must use `VITE_API_URL` environment variable

## Local Development

For local development, run in two terminals:

**Terminal 1 - Start Backend:**
```bash
npm run backend
# Backend runs on http://localhost:5001
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:5173
# Vite proxy automatically routes /api to http://localhost:5001
```

## Database Considerations

### Current Setup (SQLite)

Works for read-only operations in production. If you need write capabilities:

1. **Option 1**: Use Vercel's PostgreSQL through Neon
2. **Option 2**: Store database in `/tmp` (temporary, not persistent)
3. **Option 3**: Use Vercel Blob Storage

For now, SQLite is fine if your operations are read-only.

## Environment Variables Summary

| Variable | Local Dev | Production |
|----------|-----------|------------|
| `VITE_API_URL` | Not set (uses `/api`) | `https://your-backend.vercel.app/api` |

## Production URLs After Deployment

- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app/api`
- **Database**: Stored at `/api/uic_courses.db`

## Next Steps

1. Test the deployed application thoroughly
2. Monitor performance in Vercel Dashboard
3. Set up custom domain (optional)
4. Configure auto-deployments from GitHub

For detailed information, see the official [Vercel Python documentation](https://vercel.com/docs/functions/python).
