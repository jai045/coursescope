# 🔬 Vercel Deployment - Step-by-Step Verification Guide

Complete each step and verify before moving to the next.

---

## ✅ STEP 1: Local Setup Verification

### Check Frontend Setup
```bash
# From project root
pwd
# Output: .../coursescope-main 2

ls -la src/App.jsx
# Output: -rw-r--r-- ... src/App.jsx ✅

ls -la vite.config.js
# Output: -rw-r--r-- ... vite.config.js ✅

npm run build 2>&1 | tail -20
# Should end with: ✓ built in X.XXs ✅
```

**Expected Result:**
- [ ] `dist/` folder created
- [ ] `dist/index.html` exists
- [ ] No build errors

---

## ✅ STEP 2: Backend Setup Verification

### Check Backend Files
```bash
# From project root
ls -la api/
# Should show: _db.py, majors.py, courses.py, etc.

ls -la api/uic_courses.db
# Should show file with size > 1MB

grep "def handler" api/majors.py
# Should show BaseHTTPRequestHandler method ✅
```

**Expected Result:**
- [ ] All Python files in `/api`
- [ ] `uic_courses.db` exists
- [ ] Handler functions properly formatted

---

## ✅ STEP 3: Configuration Files Verification

### Check Required Config Files
```bash
# From project root
cat package.json | grep '"build"'
# Should show: "build": "vite build" ✅

cat vite.config.js | grep proxy
# Should show proxy configuration ✅

cat vercel.json
# Should show builds and routes configured ✅

cat src/App.jsx | grep VITE_API_URL
# Should show: const API_URL = import.meta.env.VITE_API_URL ✅
```

**Expected Result:**
- [ ] package.json has build script
- [ ] vite.config.js has proxy config
- [ ] vercel.json exists with correct format
- [ ] App.jsx uses VITE_API_URL

---

## ✅ STEP 4: Local Development Test

### Test Locally Before Deploying
```bash
# Terminal 1 - Start Backend
npm run backend
# Should show: Running on http://localhost:5001 ✅

# Terminal 2 - Start Frontend (after backend starts)
npm run dev
# Should show: ➜  Local:   http://localhost:5173 ✅
```

### Verify Local Setup Works
```bash
# In separate terminal
# Test backend API
curl http://localhost:5001/api/majors
# Should return JSON array ✅

# Test frontend
curl http://localhost:5173/
# Should return HTML starting with <!doctype html> ✅
```

### Test in Browser
```
1. Open http://localhost:5173 in browser
2. Open DevTools (F12) → Network tab
3. Click on any major in the UI
4. In Network tab, should see /api/majors request
5. Request should go to http://localhost:5001
6. Response should show data ✅
```

**Expected Result:**
- [ ] Backend starts on port 5001
- [ ] Frontend starts on port 5173
- [ ] API responds with data
- [ ] UI displays courses/majors correctly

---

## ✅ STEP 5: Git Repository Verification

### Prepare for Deployment
```bash
# Check git status
git status
# Should be clean (no modified files to commit)
# If not:
git add .
git commit -m "Prepare for Vercel deployment"

# Check branch
git branch
# Should show * main (or your default branch) ✅

# Verify remote
git remote -v
# Should show origin https://github.com/YOUR/REPO.git ✅

# Push to GitHub
git push origin main
# Should complete without errors ✅
```

**Expected Result:**
- [ ] Git status is clean
- [ ] On main branch
- [ ] Remote configured to GitHub
- [ ] All commits pushed to GitHub

---

## ✅ STEP 6: Vercel Account Setup Verification

### Check Vercel Setup
```bash
1. Go to https://vercel.com
2. Sign in (create account if needed)
3. Go to Dashboard
4. Click "New Project"
5. GitHub should be connected
6. Your repository should appear in the list ✅
```

**Expected Result:**
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Repository appears in project selection

---

## ✅ STEP 7: Backend Deployment Verification

### Deploy Backend
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy backend
cd <project-root>
vercel --prod

# When prompted:
# - Confirm project name: <yes to defaults>
# - Set production URL: <yes>
```

### Get Backend URL
```bash
# After deployment completes:
# Vercel will show: Production URL: https://your-backend.vercel.app
# SAVE THIS URL - you'll need it in the next step ✅

# Verify backend is accessible
curl https://your-backend.vercel.app/api/majors

# Should return JSON data (not error) ✅
```

**Expected Result:**
- [ ] Deployment completes without errors
- [ ] Backend URL is provided
- [ ] `curl https://your-backend/api/majors` returns data
- [ ] URL is saved for next step

---

## ✅ STEP 8: Frontend Environment Variable Setup

### Configure Environment Variable
```
1. Go to Vercel Dashboard
2. Create NEW PROJECT (separate from backend)
3. Select your GitHub repository
4. Before clicking Deploy, scroll to "Environment Variables"
5. Add new variable:
   - Name: VITE_API_URL
   - Value: https://your-backend.vercel.app/api
     (Use the URL from STEP 7 + /api)
6. Make sure "Production" is checked ✅
7. Click "Deploy"
```

### Verify Environment Variable
```bash
# After deployment, check Vercel Dashboard:
# Settings → Environment Variables
# Should show: VITE_API_URL = https://your-backend.vercel.app/api ✅
```

**Expected Result:**
- [ ] Frontend project created
- [ ] VITE_API_URL environment variable set
- [ ] Production deployment started

---

## ✅ STEP 9: Frontend Deployment Verification

### Wait for Deployment
```bash
# In Vercel Dashboard:
# Watch Deployments → Latest
# Should show "✓ Production" when complete ✅
```

### Test Frontend URL
```bash
# After deployment completes
curl https://your-frontend.vercel.app/ | head -20
# Should return HTML (starts with <!doctype) ✅

# Or open in browser:
# https://your-frontend.vercel.app
# Should load the CourseScope app ✅
```

**Expected Result:**
- [ ] Deployment shows "✓ Production"
- [ ] Frontend URL is accessible
- [ ] App loads without blank page

---

## ✅ STEP 10: Integration Testing

### Test API Communication
```
1. Open https://your-frontend.vercel.app in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Filter: type:xhr or type:fetch
5. Interact with app (click majors, search, etc.)
6. In Network tab, look for requests:
   - Should show: https://your-backend.vercel.app/api/...
   - Status should be 200 ✅
   - Response should show JSON data ✅
```

### Check for Errors
```
1. In DevTools, go to Console tab
2. Should NOT see:
   - Red error messages ❌
   - 404 errors ❌
   - CORS errors ❌
   - "Failed to fetch" ❌
3. Should see:
   - Data displayed in UI ✅
   - Network requests successful ✅
```

### Test All Features
```
1. Click through each major/course
2. Test search functionality
3. Test filters (level, difficulty, credits)
4. Check that grade distribution loads
5. Verify all data displays correctly
```

**Expected Result:**
- [ ] Network requests go to backend URL
- [ ] API responses show status 200
- [ ] No console errors
- [ ] All features work correctly
- [ ] Data displays in UI

---

## ✅ STEP 11: Performance Verification

### Check Performance
```bash
# In Vercel Dashboard:
# Backend Project → Functions
# Should show function execution times

# Expected:
# - First request: 0.5-2s (cold start)
# - Subsequent requests: <100ms (cached) ✅

# Frontend Project → Analytics
# Should show page load metrics
# Expected load time: <3s ✅
```

### Monitor in Production
```bash
# Test with DevTools:
1. Open DevTools → Network tab
2. Reload page (Cmd+Shift+R for hard refresh)
3. Check Network timings:
   - Initial load: <3s
   - API requests: <1s
4. Performance should be acceptable ✅
```

**Expected Result:**
- [ ] Backend cold start < 2s
- [ ] Subsequent requests < 100ms
- [ ] Frontend initial load < 3s
- [ ] API requests < 1s

---

## ✅ STEP 12: Final Verification Checklist

### Complete Verification
```
Frontend:
- [ ] Loads at https://your-frontend.vercel.app
- [ ] No blank page
- [ ] All components visible
- [ ] Styling looks correct

Backend:
- [ ] Accessible at https://your-backend.vercel.app/api/majors
- [ ] Returns JSON data
- [ ] No errors in logs

Integration:
- [ ] Frontend makes requests to backend
- [ ] API responses display in UI
- [ ] No console errors
- [ ] No CORS errors
- [ ] All features work

Performance:
- [ ] Frontend loads quickly
- [ ] API responses are fast
- [ ] Database queries complete

Environment:
- [ ] VITE_API_URL is set
- [ ] Points to correct backend URL
- [ ] Includes /api at end
```

**Result:** ✅ **DEPLOYMENT COMPLETE!**

---

## 🚨 If Something Goes Wrong

### Backend Not Accessible
```bash
1. Check Vercel Dashboard → Backend → Logs
2. Look for error messages
3. Verify uic_courses.db exists in /api folder
4. Check database has data:
   sqlite3 api/uic_courses.db "SELECT COUNT(*) FROM majors;"
5. Redeploy backend:
   vercel --prod
```

### API Returns 404
```bash
1. Verify VITE_API_URL in Frontend Vercel settings
2. Check URL format: https://backend.vercel.app/api (with /api)
3. Test backend directly: curl https://backend-url/api/majors
4. Redeploy frontend after fixing env var
```

### Frontend Shows Blank Page
```bash
1. Check DevTools Console for errors
2. Verify build succeeded: npm run build
3. Check vite.config.js is correct
4. Check App.jsx loads without errors
5. Redeploy frontend
```

### CORS Errors
```bash
1. Check backend has CORS enabled
2. Backend should have: CORS(app, resources={r"/api/*": {"origins": "*"}})
3. Test with curl: curl -i https://backend-url/api/majors
4. Look for: Access-Control-Allow-Origin: *
5. Add CORS if missing, redeploy
```

---

## 📞 Next Steps

✅ All tests passing?
1. Celebrate! 🎉
2. Share deployed URL with team
3. Monitor Vercel Dashboard for any issues
4. Set up custom domain (optional)
5. Keep documentation updated

❌ Something not working?
1. Check `DEPLOYMENT_TROUBLESHOOTING.md`
2. Review error logs in Vercel Dashboard
3. Test locally to isolate issue
4. Redeploy after fixes

---

**Verification Guide Complete!** ✨

For more help, see:
- DEPLOYMENT_QUICK_START.md
- DEPLOYMENT_TROUBLESHOOTING.md
- VERCEL_DEPLOYMENT_GUIDE.md
