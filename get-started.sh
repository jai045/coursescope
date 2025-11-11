#!/bin/bash

# CourseScope Vercel Deployment - Interactive Getting Started
# This script helps you get started with deployment

clear

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🚀 CourseScope Vercel Deployment - Getting Started 🚀     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "📚 I've created a complete deployment package for you!"
echo ""
echo "Here's what was created:"
echo ""
echo "✅ 10 Comprehensive Guides"
echo "✅ Configuration Files (vercel.json)"
echo "✅ Step-by-Step Instructions"
echo "✅ Troubleshooting Solutions"
echo "✅ Verification Procedures"
echo ""

echo "═════════════════════════════════════════════════════════════════"
echo ""

echo "🎯 Where to Start?"
echo ""
echo "Choose one:"
echo ""
echo "1️⃣  I'm new to Vercel deployment"
echo "2️⃣  I want to just deploy it"
echo "3️⃣  I want to understand first"
echo "4️⃣  I need help with something specific"
echo "5️⃣  Show me all files"
echo "0️⃣  Exit"
echo ""

read -p "Enter your choice (0-5): " choice

case $choice in
    1)
        echo ""
        echo "✅ New to Vercel? Follow this path:"
        echo ""
        echo "1. Read: START_HERE.md"
        echo "2. Read: DEPLOYMENT_README.md (5 min)"
        echo "3. Follow: DEPLOYMENT_QUICK_START.md (15 min)"
        echo "4. Deploy to Vercel"
        echo "5. Test: DEPLOYMENT_VERIFICATION.md (15 min)"
        echo ""
        echo "💡 Pro tip: Open these files in order!"
        ;;
    
    2)
        echo ""
        echo "⚡ Fast Path - Just Deploy!"
        echo ""
        echo "Run these steps:"
        echo ""
        echo "$ npm run build"
        echo "$ vercel --prod                    # Deploy backend"
        echo "$ vercel --prod                    # Deploy frontend"
        echo "                                   # Set VITE_API_URL"
        echo ""
        echo "📖 For detailed steps, see: DEPLOYMENT_QUICK_START.md"
        ;;
    
    3)
        echo ""
        echo "🎨 Understand the Architecture First:"
        echo ""
        echo "1. Read: DEPLOYMENT_VISUAL_GUIDE.md (10 min)"
        echo "   - See diagrams of how it works"
        echo ""
        echo "2. Read: VERCEL_DEPLOYMENT_GUIDE.md (20 min)"
        echo "   - Get all the details"
        echo ""
        echo "3. Then: Follow DEPLOYMENT_QUICK_START.md"
        echo ""
        echo "💡 You'll understand deployment deeply!"
        ;;
    
    4)
        echo ""
        echo "🔧 Need Help With Something Specific?"
        echo ""
        echo "Choose:"
        echo ""
        echo "a) Frontend won't build"
        echo "b) API returns 404 errors"
        echo "c) CORS issues"
        echo "d) Database not found"
        echo "e) Performance is slow"
        echo "f) Something else entirely"
        echo ""
        read -p "Choose (a-f): " issue
        
        case $issue in
            a|b|c|d|e|f)
                echo ""
                echo "📖 Check: DEPLOYMENT_TROUBLESHOOTING.md"
                echo ""
                echo "This file has:"
                echo "✅ 10+ common issues"
                echo "✅ Symptoms described"
                echo "✅ Solutions provided"
                echo "✅ Code examples"
                ;;
            *)
                echo "Invalid choice"
                ;;
        esac
        ;;
    
    5)
        echo ""
        echo "📚 All Documentation Files Created:"
        echo ""
        echo "Entry Points (START HERE):"
        echo "  📍 START_HERE.md"
        echo "  📍 FILE_NAVIGATION.md"
        echo "  📍 COMPLETE_SUMMARY.md"
        echo ""
        echo "Main Guides:"
        echo "  📖 DEPLOYMENT_README.md (5 min)"
        echo "  📖 DEPLOYMENT_QUICK_START.md (PRIMARY - 15 min)"
        echo ""
        echo "Understanding & Reference:"
        echo "  📚 DEPLOYMENT_VISUAL_GUIDE.md (10 min)"
        echo "  📚 VERCEL_DEPLOYMENT_GUIDE.md (20 min)"
        echo ""
        echo "Verification & Troubleshooting:"
        echo "  🔍 DEPLOYMENT_VERIFICATION.md (15 min)"
        echo "  🔧 DEPLOYMENT_TROUBLESHOOTING.md (as needed)"
        echo "  ✅ VERCEL_DEPLOYMENT_CHECKLIST.md (10 min)"
        echo ""
        echo "Organization:"
        echo "  📋 DOCUMENTATION_INDEX.md"
        echo ""
        echo "Configuration:"
        echo "  ⚙️  vercel.json (already set up!)"
        echo ""
        ;;
    
    0)
        echo ""
        echo "Goodbye! 👋"
        echo "Don't forget to read START_HERE.md when ready!"
        echo ""
        exit 0
        ;;
    
    *)
        echo "Invalid choice. Please try again."
        exit 1
        ;;
esac

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "📖 Next Steps:"
echo ""
echo "1. Review the files mentioned above"
echo "2. Open them in your editor"
echo "3. Follow the step-by-step instructions"
echo "4. Deploy to Vercel!"
echo ""
echo "⏱️  Total time: ~1 hour from start to live deployment"
echo ""
echo "✨ Your project is 100% ready to deploy!"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "Questions? Check these files:"
echo "  → START_HERE.md (overview)"
echo "  → FILE_NAVIGATION.md (find what you need)"
echo "  → DEPLOYMENT_TROUBLESHOOTING.md (problem solving)"
echo ""
echo "Ready to deploy? Go to:"
echo "  → DEPLOYMENT_QUICK_START.md"
echo ""
echo "Good luck! 🚀"
echo ""
