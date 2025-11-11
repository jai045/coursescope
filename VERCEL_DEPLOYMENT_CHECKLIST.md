# ✅ Vercel Deployment Configuration Checklist

Use this checklist to ensure your project is properly configured for Vercel deployment.

## 📦 Frontend Configuration

- [ ] `package.json` has `"build": "vite build"` script
- [ ] `vite.config.js` exists and is configured
- [ ] `src/App.jsx` uses `import.meta.env.VITE_API_URL`
- [ ] All dependencies are in `package.json` (no global installs)
- [ ] `dist/` folder is in `.gitignore`
- [ ] Node modules are in `.gitignore`

## 🔧 Backend Configuration

### Python Files
- [ ] `api/_db.py` has database connection logic
- [ ] `api/*.py` files are serverless functions (use `BaseHTTPRequestHandler`)
- [ ] All required Python files are in `/api` folder
- [ ] `api/requirements.txt` lists Python dependencies

### Database
- [ ] `api/uic_courses.db` exists and contains data
- [ ] Database is committed to GitHub (or generated on deploy)

### API Endpoints
- [ ] `GET /api/majors` - returns list of majors
- [ ] `GET /api/courses` - returns all courses
- [ ] `GET /api/course?code=` - returns specific course
- [ ] `POST /api/eligible` - returns eligible courses
- [ ] `GET /api/grades?code=` - returns grade distribution

### CORS Configuration
- [ ] Backend has CORS enabled for all origins
- [ ] Vercel serverless functions can handle cross-origin requests

## 🌐 Deployment Files

- [ ] `vercel.json` exists at root level
- [ ] `vercel.json` has correct Python and static builds configured
- [ ] Routes in `vercel.json` properly handle `/api/*` and `/*` paths

## 🔐 Environment Variables

### Local Development
- [ ] Frontend works without `VITE_API_URL` (uses `/api` proxy)
- [ ] Backend runs on `http://localhost:5001`
- [ ] `vite.config.js` proxies `/api` to backend

### Production (Vercel)
- [ ] `VITE_API_URL` environment variable set to backend API URL
- [ ] Backend is deployed and accessible
- [ ] Frontend can reach backend (test with curl)

## 🚀 Pre-Deployment

### Code Quality
- [ ] No console errors: `npm run build` completes without warnings
- [ ] Code is formatted and follows project style
- [ ] No hardcoded localhost references except in proxy config
- [ ] No API keys or secrets in code

### Git Repository
- [ ] All changes committed: `git status` is clean
- [ ] Latest code pushed to GitHub: `git push origin main`
- [ ] GitHub branch is set to default branch (main)
- [ ] No merge conflicts

### Testing
- [ ] Frontend builds successfully: `npm run build`
- [ ] Backend can be started locally: `npm run backend`
- [ ] API endpoints work locally: `curl http://localhost:5001/api/majors`
- [ ] All major features work in local dev

## 📋 Vercel Dashboard Setup

### Project Creation
- [ ] GitHub repository connected to Vercel
- [ ] Correct repository selected
- [ ] Main/master branch selected as production branch

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- [ ] Settings are correct

### Environment Variables
- [ ] `VITE_API_URL` = `https://your-backend.vercel.app/api`
- [ ] Variable is set for Production environment
- [ ] Variable is NOT set for Preview/Development (optional)

### Deployment
- [ ] Initial deployment succeeded
- [ ] Deployment logs show no errors
- [ ] Frontend URL is accessible

## ✨ Post-Deployment Verification

### Frontend
- [ ] Frontend loads at `https://your-project.vercel.app`
- [ ] Page layout is correct (no styling issues)
- [ ] All components render properly

### Backend
- [ ] Backend is accessible at API URL
- [ ] API endpoints return data: `curl https://your-backend/api/majors`
- [ ] Database is loaded: API returns results, not errors

### Integration
- [ ] Frontend makes requests to backend
- [ ] Data displays correctly in UI
- [ ] No 404 errors in console
- [ ] No CORS errors in console
- [ ] No errors in Vercel function logs

### Performance
- [ ] Page loads within reasonable time
- [ ] API responses are reasonably fast
- [ ] Database caching is working

## 🔄 Continuous Deployment

- [ ] Auto-deploy on GitHub push is enabled
- [ ] Webhook from GitHub to Vercel is working
- [ ] Pulling latest changes from GitHub works

## 🎯 Optional Enhancements

- [ ] Set up custom domain (not required)
- [ ] Enable analytics in Vercel
- [ ] Configure error tracking
- [ ] Set up monitoring/alerts
- [ ] Create multiple environments (staging, production)

---

## 🚨 Common Issues Checklist

If you encounter issues, verify:

| Issue | Checklist |
|-------|-----------|
| **Frontend won't load** | Build output, dist folder exists, routes configured |
| **API returns 404** | Backend deployed, URL correct in VITE_API_URL |
| **CORS errors** | Backend has CORS enabled, frontend using correct URL |
| **Database missing** | `uic_courses.db` in /api, file is committed |
| **Slow API** | Caching configured, database indexed, functions optimized |

---

## 📝 Notes

- Each checkbox is important - don't skip them
- Green ✅ means configured correctly
- If stuck on any item, see `DEPLOYMENT_QUICK_START.md`
- Keep this checklist for future deployments

Last Updated: November 2024
