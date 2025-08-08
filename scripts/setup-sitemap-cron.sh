#!/bin/bash

# Setup script for InspectorsNearMe.com Sitemap Cron Job
# This script configures automated sitemap generation

echo "🗺️  InspectorsNearMe.com Sitemap Cron Setup"
echo "============================================"

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_PATH=$(which node)

echo "Project directory: $PROJECT_DIR"
echo "Node.js path: $NODE_PATH"

# Make scripts executable
echo "Making scripts executable..."
chmod +x "$SCRIPT_DIR/sitemap-cron.js"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"
echo "Logs directory: $PROJECT_DIR/logs"

# Test the sitemap system
echo ""
echo "🧪 Testing sitemap system..."

cd "$PROJECT_DIR"

# Test environment
echo "Checking environment..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "✅ Environment file found"
else
    echo "❌ No .env or .env.local file found"
    echo "Please create .env with required variables:"
    echo "SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_ANON_KEY=your-anon-key"
    echo "NEXT_PUBLIC_APP_URL=https://inspectorsnearme.com"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
npm run verify-db > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection issue - check your environment variables"
fi

# Test sitemap generation
echo "Testing sitemap generation..."
npm run sitemap > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sitemap generation successful"
else
    echo "❌ Sitemap generation failed - check logs/sitemap-generation.log"
fi

# Test validation
echo "Testing sitemap validation..."
npm run sitemap-validate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sitemap validation successful"
else
    echo "⚠️  Sitemap validation issues - check logs/sitemap-validation.log"
fi

echo ""
echo "📅 Setting up cron job..."

# Create cron job entry
CRON_COMMAND="0 2 * * * cd $PROJECT_DIR && $NODE_PATH scripts/sitemap-cron.js >> logs/sitemap-cron.log 2>&1"

echo "Suggested cron job entry:"
echo "$CRON_COMMAND"

# Ask if user wants to install cron job
echo ""
read -p "Would you like to install this cron job? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
    echo "✅ Cron job installed successfully"
    echo "The sitemap will be automatically generated daily at 2:00 AM"
else
    echo "ℹ️  To manually install the cron job later, run:"
    echo "crontab -e"
    echo "Then add this line:"
    echo "$CRON_COMMAND"
fi

echo ""
echo "🔧 Manual Commands:"
echo "==================="
echo "Generate sitemaps:     npm run sitemap"
echo "Validate sitemaps:     npm run sitemap-validate"
echo "Health check:          npm run sitemap-health"
echo "Force regeneration:    npm run sitemap-force"
echo "Run cron manually:     npm run sitemap-cron"

echo ""
echo "📁 File Locations:"
echo "=================="
echo "Main sitemap:          $PROJECT_DIR/public/sitemap.xml"
echo "robots.txt:            $PROJECT_DIR/public/robots.txt"
echo "Logs directory:        $PROJECT_DIR/logs/"
echo "Generation logs:       $PROJECT_DIR/logs/sitemap-generation.log"
echo "Validation logs:       $PROJECT_DIR/logs/sitemap-validation.log"
echo "Cron logs:             $PROJECT_DIR/logs/sitemap-cron.log"

echo ""
echo "🌐 URLs:"
echo "========"
echo "Sitemap:               $NEXT_PUBLIC_APP_URL/sitemap.xml"
echo "robots.txt:            $NEXT_PUBLIC_APP_URL/robots.txt"
echo "Dynamic sitemap API:   $NEXT_PUBLIC_APP_URL/api/sitemap"

# Check if we can access the public directory
if [ -f "$PROJECT_DIR/public/sitemap.xml" ]; then
    SITEMAP_SIZE=$(stat -f%z "$PROJECT_DIR/public/sitemap.xml" 2>/dev/null || stat -c%s "$PROJECT_DIR/public/sitemap.xml" 2>/dev/null)
    URL_COUNT=$(grep -c "<url>" "$PROJECT_DIR/public/sitemap.xml" 2>/dev/null || echo "0")
    echo ""
    echo "📊 Current Sitemap Stats:"
    echo "========================="
    echo "File size:             $SITEMAP_SIZE bytes"
    echo "URL count:             $URL_COUNT"
    echo "Last modified:         $(stat -f%Sm "$PROJECT_DIR/public/sitemap.xml" 2>/dev/null || stat -c%y "$PROJECT_DIR/public/sitemap.xml" 2>/dev/null)"
fi

echo ""
echo "✅ Sitemap system setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Verify your sitemaps are accessible at $NEXT_PUBLIC_APP_URL/sitemap.xml"
echo "2. Submit your sitemap to Google Search Console"
echo "3. Submit your sitemap to Bing Webmaster Tools"
echo "4. Monitor the logs for any issues"
echo ""
echo "For detailed documentation, see: SITEMAP_SYSTEM_README.md"