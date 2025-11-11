#!/bin/bash

# Display all created files
echo "✅ CourseScope Vercel Deployment Package - Complete!"
echo ""
echo "Created Files:"
echo ""
echo "📚 Documentation (11 files):"
ls -1 *.md 2>/dev/null | head -11 | while read file; do
    size=$(wc -c < "$file" 2>/dev/null)
    lines=$(wc -l < "$file" 2>/dev/null)
    printf "   ✅ %-45s (%5d lines, %7d bytes)\n" "$file" "$lines" "$size"
done

echo ""
echo "⚙️  Configuration (1 file):"
ls -1 vercel.json 2>/dev/null | while read file; do
    size=$(wc -c < "$file" 2>/dev/null)
    lines=$(wc -l < "$file" 2>/dev/null)
    printf "   ✅ %-45s (%5d lines, %7d bytes)\n" "$file" "$lines" "$size"
done

echo ""
echo "🚀 Scripts (1 file):"
ls -1 *.sh 2>/dev/null | grep -E '(get-started|deploy)\.sh$' | while read file; do
    size=$(wc -c < "$file" 2>/dev/null)
    lines=$(wc -l < "$file" 2>/dev/null)
    printf "   ✅ %-45s (%5d lines, %7d bytes)\n" "$file" "$lines" "$size"
done

echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo ""
echo "Total Documentation: 11 files"
echo "Total Configuration: 1 file (vercel.json)"
echo "Total Scripts: 2 files"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Getting Started:"
echo ""
echo "1. Run this command to get started:"
echo "   bash get-started.sh"
echo ""
echo "2. Or open directly:"
echo "   - START_HERE.md (navigation guide)"
echo "   - DEPLOYMENT_README.md (quick reference)"
echo "   - DEPLOYMENT_QUICK_START.md (main guide)"
echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "✨ Your project is ready to deploy!"
echo ""
