#!/bin/bash

# Home Inspector Enrichment Execution Script
# Enriches all pending home inspectors with comprehensive data

echo "🏠 Starting Home Inspector Enrichment Process..."
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if environment file exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Please create it with required credentials."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the enrichment script
echo "🚀 Executing home inspector enrichment..."
echo ""

node scripts/enrich-home-inspectors.js

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Home inspector enrichment completed successfully!"
    echo ""
    echo "📊 Check the logs for detailed results:"
    echo "   - logs/home-inspector-enrichment.log"
    echo "   - logs/home-inspector-enrichment-report.json"
else
    echo ""
    echo "❌ Home inspector enrichment failed. Check the logs for details."
    exit 1
fi