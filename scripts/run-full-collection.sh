#!/bin/bash

# Full Collection Script for InspectorsNearMe.com
# Collects all remaining inspector categories across 20 major US cities

echo "🚀 Starting Full Inspector Collection"
echo "===================================="
echo "Categories: Mold, Foundation, Pool, Radon, Commercial, Specialty"
echo "Cities: 20 major US markets"
echo "Expected total: ~1,200 inspectors"
echo ""

# Define cities array
declare -a cities=(
  "New York City:NY"
  "Los Angeles:CA"
  "Chicago:IL"
  "Houston:TX"
  "Phoenix:AZ"
  "Philadelphia:PA"
  "San Antonio:TX"
  "San Diego:CA"
  "Dallas:TX"
  "San Jose:CA"
  "San Francisco:CA"
  "Seattle:WA"
  "Austin:TX"
  "Denver:CO"
  "Boston:MA"
  "Miami:FL"
  "Atlanta:GA"
  "Washington:DC"
  "Las Vegas:NV"
  "Portland:OR"
)

# Define categories to collect
declare -a categories=("mold" "foundation" "pool" "radon" "commercial" "specialty")

# Function to collect one category
collect_category() {
  local category=$1
  echo ""
  echo "📋 COLLECTING: ${category^^} INSPECTORS"
  echo "======================================="
  echo "Starting at: $(date)"
  echo ""
  
  local count=0
  for city_state in "${cities[@]}"; do
    IFS=':' read -r city state <<< "$city_state"
    count=$((count + 1))
    
    echo "[$count/20] Collecting $category inspectors in $city, $state..."
    node scripts/collect-city.js "$category" "$city" "$state"
    
    # Rate limit between cities (30 seconds)
    if [ $count -lt 20 ]; then
      echo "⏳ Waiting 30 seconds before next city..."
      sleep 30
    fi
  done
  
  echo ""
  echo "✅ Completed ${category^^} category at: $(date)"
  echo ""
  
  # Longer pause between categories (2 minutes)
  echo "⏸️  Pausing 2 minutes before next category..."
  sleep 120
}

# Main collection loop
start_time=$(date)
echo "Collection started at: $start_time"
echo ""

for category in "${categories[@]}"; do
  collect_category "$category"
done

echo ""
echo "🎉 COLLECTION COMPLETE!"
echo "======================"
echo "Started: $start_time"
echo "Finished: $(date)"
echo ""
echo "Next steps:"
echo "1. Check database for collected inspectors"
echo "2. Run enrichment process"
echo "3. Generate quality reports"