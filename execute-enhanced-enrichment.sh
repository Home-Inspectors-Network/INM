#!/bin/bash

echo "🚀 EXECUTING ENHANCED ENRICHMENT PROCESS"
echo "========================================"
echo "Using the correct database schema for enhanced enrichment"
echo ""

# Set up environment
export NODE_ENV=production

# Execute the enhanced enrichment demonstration
echo "📋 Running enhanced enrichment SQL demonstration..."
node scripts/demonstrate-enrichment-sql.js

echo ""
echo "✅ Enhanced enrichment process execution completed"