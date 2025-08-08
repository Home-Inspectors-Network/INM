#!/bin/bash

echo "🚀 Starting Bay Area Inspector Enrichment Pipeline"
echo "=================================================="

# Ensure logs directory exists
mkdir -p logs

# Step 1: Run the main enrichment pipeline
echo "📦 Running main enrichment pipeline..."
cd /Users/chris/2org-inspectorsnearme
node scripts/bay-area-enrichment-pipeline.js

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Enrichment pipeline completed successfully!"
    
    # Step 2: Run quality control
    echo "🛡️ Running quality control..."
    node scripts/enrichment-quality-control.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Quality control completed successfully!"
        
        # Step 3: Generate final reports
        echo "📊 Generating final reports..."
        node scripts/bay-area-enrichment-pipeline.js report
        node scripts/enrichment-quality-control.js report
        
        echo "🎉 Bay Area enrichment process completed!"
        echo "Check the logs/ directory for detailed reports."
    else
        echo "❌ Quality control failed!"
        exit 1
    fi
else
    echo "❌ Enrichment pipeline failed!"
    exit 1
fi