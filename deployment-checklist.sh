#!/bin/bash

# CourseScope Vercel Deployment Checklist
# Run this script to verify everything is ready for deployment

echo "🚀 CourseScope Vercel Deployment Checklist"
echo "=========================================="
echo ""

# Check 1: Git repository
echo "✓ Checking Git repository..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "  ✅ Git repository found"
else
    echo "  ❌ Not a git repository"
    exit 1
fi
echo ""

# Check 2: Frontend files
echo "✓ Checking frontend files..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json found"
else
    echo "  ❌ package.json not found"
fi

if [ -f "vite.config.js" ]; then
    echo "  ✅ vite.config.js found"
else
    echo "  ❌ vite.config.js not found"
fi

if [ -d "src" ]; then
    echo "  ✅ src/ directory found"
else
    echo "  ❌ src/ directory not found"
fi
echo ""

# Check 3: Backend files
echo "✓ Checking backend files..."
if [ -d "api" ]; then
    echo "  ✅ api/ directory found"
else
    echo "  ❌ api/ directory not found"
fi

if [ -f "api/_db.py" ]; then
    echo "  ✅ api/_db.py found"
else
    echo "  ❌ api/_db.py not found"
fi

if [ -f "api/uic_courses.db" ]; then
    echo "  ✅ api/uic_courses.db found"
else
    echo "  ❌ api/uic_courses.db not found (this may be needed)"
fi
echo ""

# Check 4: Configuration files
echo "✓ Checking configuration files..."
if [ -f "vercel.json" ]; then
    echo "  ✅ vercel.json found (root level)"
else
    echo "  ⚠️  vercel.json not found at root (optional)"
fi
echo ""

# Check 5: Build capability
echo "✓ Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Frontend builds successfully"
    if [ -d "dist" ]; then
        echo "  ✅ dist/ directory created"
    fi
else
    echo "  ❌ Frontend build failed"
    echo "  Run 'npm run build' to debug"
fi
echo ""

# Check 6: Node modules
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules found"
else
    echo "  ⚠️  node_modules not found. Run 'npm install'"
fi
echo ""

# Summary
echo "=========================================="
echo "📋 Deployment Checklist Complete!"
echo ""
echo "Next Steps:"
echo "1. Ensure all checks pass ✅"
echo "2. Push to GitHub: git push origin main"
echo "3. Go to https://vercel.com/dashboard"
echo "4. Click 'New Project' and select your repository"
echo "5. Configure environment variables:"
echo "   - VITE_API_URL: https://your-backend.vercel.app/api"
echo "6. Deploy!"
echo ""
echo "📖 For detailed guide, see: VERCEL_DEPLOYMENT_GUIDE.md"
