#!/bin/bash

# Enhanced Multi-City Enrichment System Launcher
# Processes all 97 inspectors with 0/100 quality scores
# Targets 80+ inspectors with excellent scores (85+)

echo "🚀 ENHANCED MULTI-CITY ENRICHMENT SYSTEM"
echo "========================================"
echo "Target: Process all inspectors with 0/100 quality scores"
echo "Goal: Achieve 80+ inspectors with excellent scores (85+)"
echo ""

# Ensure logs directory exists
mkdir -p logs

# Step 1: Initial progress baseline
echo "📊 Step 1: Generating baseline progress report..."
node scripts/enrichment-progress-monitor.js

echo ""
echo "⏳ Starting enrichment process in 5 seconds..."
sleep 5

# Step 2: Execute comprehensive enrichment (background process)
echo "🔍 Step 2: Starting comprehensive enrichment system..."
echo "⏱️  Processing inspectors with 3-second delays between requests"
echo "💾 Progress logged to: logs/comprehensive-enrichment.log"
echo ""

# Start enrichment in background
nohup node scripts/execute-comprehensive-enrichment.js > logs/enrichment-output.log 2>&1 &
ENRICHMENT_PID=$!
echo "🔄 Enrichment process started (PID: $ENRICHMENT_PID)"

# Step 3: Start continuous monitoring
echo "📈 Step 3: Starting progress monitoring (every 5 minutes)..."
nohup node scripts/enrichment-progress-monitor.js continuous 5 > logs/monitoring-output.log 2>&1 &
MONITOR_PID=$!
echo "📊 Monitoring process started (PID: $MONITOR_PID)"

echo ""
echo "🎯 SYSTEM RUNNING"
echo "================"
echo "✅ Enrichment Process: PID $ENRICHMENT_PID"
echo "✅ Progress Monitor: PID $MONITOR_PID"
echo ""
echo "📋 Log Files:"
echo "  - Enrichment: logs/comprehensive-enrichment.log"
echo "  - Monitoring: logs/monitoring-output.log" 
echo "  - Progress: logs/enrichment-progress.json"
echo ""
echo "🛑 To stop all processes:"
echo "  kill $ENRICHMENT_PID $MONITOR_PID"
echo ""

# Function to check if process is still running
check_process() {
    if ps -p $1 > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Monitor the enrichment process
echo "⏳ Waiting for enrichment to complete..."
while check_process $ENRICHMENT_PID; do
    echo "🔄 Enrichment still running... ($(date))"
    sleep 30
done

echo ""
echo "✅ ENRICHMENT COMPLETED!"
echo "======================"

# Stop monitoring
kill $MONITOR_PID 2>/dev/null

# Generate final report
echo "📊 Generating final progress report..."
node scripts/enrichment-progress-monitor.js

echo ""
echo "🎉 ENRICHMENT SYSTEM COMPLETE!"
echo "============================="
echo "📄 Check detailed reports in the logs/ directory"
echo "🌟 Review top performers and quality improvements"