# 🔧 Vercel Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. ❌ Frontend Loads Blank/White Page

**Symptoms:**
- Browser shows blank page
- No errors in console
- Page source shows HTML but nothing renders

**Solutions:**

Check console for JavaScript errors:
```bash
# Open DevTools (F12) → Console tab
# Look for red error messages
```

Verify build succeeded:
```bash
npm run build
# Should create /dist folder with files
ls -la dist/
```

Check that build script exists in package.json:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

Common causes:
- [ ] Missing React Router in production
- [ ] Environment variable not set
- [ ] Build failed silently
- [ ] JavaScript bundle corrupted

---

### 2. ❌ API Returns 404 "Not Found"

**Symptoms:**
- Network tab shows `/api/majors` returning 404
- Console shows "Failed to fetch"
- Backend endpoint errors in Network tab

**Solutions:**

Verify backend is deployed:
```bash
curl https://your-backend-api.vercel.app/api/majors
# Should return JSON, not HTML error page
```

Check `VITE_API_URL` is set:
```javascript
// Open DevTools → Console
console.log(import.meta.env.VITE_API_URL)
// Should show: https://your-backend-api.vercel.app/api
```

Verify URL format in Vercel:
- Go to Vercel Dashboard → Frontend Project → Settings
- Environment Variables
- `VITE_API_URL` should be: `https://backend-name.vercel.app/api`
- NOT: `https://backend-name.vercel.app` (missing /api)
- NOT: `http://localhost:5001` (won't work in production)

Redeploy frontend after changing environment variables:
```bash
# If changed VITE_API_URL in Vercel, you MUST redeploy
vercel --prod
# OR in Dashboard: Deployments → Redeploy → Latest
```

---

### 3. ⚠️ CORS Error

**Symptoms:**
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' 
has been blocked by CORS policy
```

**Causes:**
- Backend doesn't have CORS enabled
- Frontend and backend URLs don't match domain

**Solutions:**

Check backend has CORS enabled in `api/_db.py`:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})  # ✅ Correct
```

If using serverless functions, verify in handler:
```python
def handler(environ, start_response):
    headers = [
        ('Content-Type', 'application/json'),
        ('Access-Control-Allow-Origin', '*'),  # ✅ Add this
        ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ('Access-Control-Allow-Headers', 'Content-Type'),
    ]
    start_response('200 OK', headers)
    return [b'...']
```

If still failing, check:
- Backend URL has correct domain (no typos)
- No firewall blocking requests
- Backend is actually running and accessible

---

### 4. 💾 Database Not Found / API Returns Empty

**Symptoms:**
- API calls succeed (200 OK) but return no data
- Endpoint returns `[]` or `null`
- Error: "database file not found"

**Solutions:**

Verify database exists locally:
```bash
ls -la backend/uic_courses.db
ls -la api/uic_courses.db
# Should show file size > 0
```

If database doesn't exist, generate it:
```bash
cd backend
python generic_course_scraper.py
python generic_major_scraper.py
# Creates uic_courses.db
```

Ensure database is committed to GitHub:
```bash
git add api/uic_courses.db
git commit -m "Add database"
git push origin main
```

Verify database on Vercel:
```bash
# This can't be done directly, but check logs:
# Vercel Dashboard → Backend → Functions → View Logs
# Should show database being read
```

Test database locally:
```bash
cd backend
python -c "
import sqlite3
conn = sqlite3.connect('uic_courses.db')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM majors')
print(cursor.fetchone())
"
# Should print: (number > 0)
```

---

### 5. 🔄 Environment Variables Not Working

**Symptoms:**
- `import.meta.env.VITE_API_URL` is `undefined`
- Frontend uses `"/api"` instead of backend URL
- Falling back to local proxy

**Solutions:**

Environment variables must be prefixed with `VITE_`:
```javascript
// ✅ Works
const url = import.meta.env.VITE_API_URL

// ❌ Doesn't work
const url = import.meta.env.API_URL
```

Set in Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add: `VITE_API_URL` = `https://backend-url.vercel.app/api`
3. Make sure **Production** checkbox is selected
4. Click **Save**

Redeploy frontend:
```bash
# Environment variables only apply to new deployments
vercel --prod
```

Verify it's set:
```bash
# After redeployment, open DevTools
console.log(import.meta.env.VITE_API_URL)
# Should show your backend URL
```

Check that variable is used in code:
```javascript
// In src/App.jsx or wherever you make API calls
const API_URL = import.meta.env.VITE_API_URL || "/api";
console.log("Using API URL:", API_URL);
```

---

### 6. 🔄 Local Development Works, Production Doesn't

**Symptoms:**
- `npm run dev` works fine locally
- Same code fails after Vercel deployment
- Works when backend runs locally

**Likely Cause:**
- Frontend still using local proxy `/api` in production
- Backend URL not set in `VITE_API_URL`

**Solution:**

Check current setup:
```bash
# In local dev, check if vite proxy is working
npm run dev
# Opens http://localhost:5173
# Open DevTools → Network
# Requests to /api should go to localhost:5001
```

In production, API calls must use backend URL:
```javascript
// ✅ Correct: Explicit backend URL in production
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Check if it's loading correctly
console.log("API URL:", API_URL);
```

Verify environment variable:
```bash
# In Vercel Dashboard
# Settings → Environment Variables
# VITE_API_URL should be set to backend URL
```

---

### 7. 🚫 "502 Bad Gateway" or "502 Service Unavailable"

**Symptoms:**
- Request returns 502 error
- API was working, now broken
- Happens randomly or after deployment

**Possible Causes:**
- Backend function crashed
- Database connection failed
- Timeout (function took too long)
- Memory limit exceeded

**Solutions:**

Check Vercel function logs:
```bash
# Vercel Dashboard → Backend Project → Functions
# Look for errors in logs
```

Verify backend locally:
```bash
npm run backend
curl http://localhost:5001/api/majors
# Should return data
```

Check for infinite loops or long-running operations:
```python
# In api/*.py, ensure queries complete quickly
# Add timeouts for database operations
```

Common Python issues:
```python
# ❌ Bad: This might timeout
def handler(environ, start_response):
    result = run_complex_query()  # Takes too long!
    
# ✅ Good: Use caching
@cache.cached(timeout=600)
def get_majors():
    return query_database()
```

Restart function (redeploy):
```bash
vercel --prod
```

---

### 8. 🔗 "Failed to Fetch" in Browser Console

**Symptoms:**
- Console shows `TypeError: Failed to fetch`
- No network request appears in Network tab
- Happens before request is sent

**Possible Causes:**
- Incorrect API URL (typo in VITE_API_URL)
- Backend not deployed or inaccessible
- Proxy misconfigured
- Browser security restrictions

**Solutions:**

Test API directly:
```bash
# In terminal
curl https://your-backend-url/api/majors

# In browser DevTools Console
fetch('https://your-backend-url/api/majors')
    .then(r => r.json())
    .then(console.log)
```

Check URL format:
```javascript
// In DevTools Console
console.log(import.meta.env.VITE_API_URL)
// Should be: https://backend.vercel.app/api (no trailing slash)
```

Verify CORS headers:
```bash
# Check if CORS is set correctly
curl -i https://your-backend-url/api/majors
# Look for: Access-Control-Allow-Origin: *
```

---

### 9. 📦 "Module Not Found" or Import Errors

**Symptoms:**
- `npm run build` fails
- Error: "Cannot find module 'X'"
- Deployment stops

**Cause:**
- Missing dependency in package.json
- Node modules not included

**Solution:**

Check if dependency is installed:
```bash
npm list <package-name>
# or
npm ls
```

Install missing dependency:
```bash
npm install <package-name>
```

Update package.json:
```bash
# Should show updated package.json
git diff package.json
```

Commit and push:
```bash
git add package.json package-lock.json
git commit -m "Add missing dependencies"
git push origin main
```

Redeploy:
```bash
vercel --prod
```

---

### 10. ⏱️ Slow Performance / Timeouts

**Symptoms:**
- Pages load very slowly
- API requests take 10+ seconds
- Functions timeout

**Solutions:**

Enable caching in backend:
```python
# In api/_db.py
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.cached(timeout=600)
def expensive_query():
    # Query runs once every 10 minutes
    pass
```

Add database indexes:
```python
# In backend, add indexes for common queries
CREATE INDEX idx_course_code ON courses(code);
CREATE INDEX idx_major_name ON majors(name);
```

Check Vercel function logs for slow operations:
```bash
# Vercel Dashboard → Functions → Logs
# Look for functions taking >5 seconds
```

Optimize database queries:
```python
# ❌ Bad: Returns everything
SELECT * FROM courses

# ✅ Good: Return only needed columns
SELECT code, name, credits FROM courses WHERE level > 100
```

---

## 🆘 Getting Help

If you're still stuck:

1. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Deployments → View Details
   - Look for error messages

2. **Check Browser Console:**
   - DevTools (F12) → Console tab
   - Copy exact error message

3. **Test API directly:**
   ```bash
   curl https://backend-url/api/majors
   ```

4. **Verify locally first:**
   ```bash
   npm run backend  # Terminal 1
   npm run dev      # Terminal 2
   # Test everything works before deploying
   ```

5. **Check documentation:**
   - `DEPLOYMENT_QUICK_START.md`
   - `VERCEL_DEPLOYMENT_GUIDE.md`
   - `DEPLOYMENT_VISUAL_GUIDE.md`

---

## ✅ Quick Verification Checklist

After each deployment, verify:

```bash
# 1. Frontend loads
curl https://your-frontend.vercel.app/ | head -20
# Should return HTML

# 2. Backend responds
curl https://your-backend.vercel.app/api/majors
# Should return JSON

# 3. Environment variable is set
# Check in Vercel Dashboard → Settings → Environment Variables
# VITE_API_URL should be set

# 4. Browser test
# Open https://your-frontend.vercel.app in browser
# Open DevTools → Network tab
# Check that /api requests go to backend URL
```

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- Python Runtime: https://vercel.com/docs/functions/python
- Vite Docs: https://vitejs.dev
- Flask Docs: https://flask.palletsprojects.com

---

Last Updated: November 2024
