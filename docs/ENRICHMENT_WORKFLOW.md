# Inspector Data Enrichment Workflow

## Overview
This document outlines the complete workflow for collecting, enriching, and displaying inspector data to ensure consistent results every time.

## Agent Coordination

### 1. Data Strategy Specialist
- **Role**: Analyzes market needs and sets collection parameters
- **Responsibilities**: 
  - Determines geographic expansion priorities
  - Sets inspector type collection phases
  - Provides search term recommendations
  - Monitors collection success metrics

### 2. Inspector Data Harvester  
- **Role**: Collects raw inspector data using Google Maps API
- **Current Focus**: California Bay Area (San Francisco, Oakland, San Jose, etc.)
- **Multi-Phase Collection**:
  - Phase 1: Home Inspectors
  - Phase 2: Termite/Pest Inspectors
  - Phase 3: Foundation/Structural Inspectors  
  - Phase 4: Specialty Inspectors (Mold, Radon, Pool/Spa)
  - Phase 5: Commercial Building Inspectors

### 3. Listing Quality Manager
- **Role**: Enriches data and maintains quality standards
- **Critical Tasks**:
  - Always use `detailed_services` array for front-end display
  - Extract logos from websites when available
  - Ensure 90%+ enrichment success rate
  - Verify enriched data displays correctly

## Enrichment Pipeline

### Step 1: Data Collection
```bash
# Run Bay Area data collection
node scripts/harvest-bay-area.js
```

### Step 2: Website Discovery  
```bash
# Fetch real websites from Google Places API
node scripts/fetch-websites-from-google.js
```

### Step 3: Data Enrichment
```bash
# Extract logos, services, photos from websites
node scripts/enrich-inspector-data.js
```

### Step 4: Visual Verification
```bash
# Test that enriched data displays correctly
node scripts/visual-verification-test.js
```

## Quality Standards

### Minimum Data Requirements
- Business name and phone number (required)
- City and state (required) 
- Inspector type/specialty (required)
- Google Place ID for future updates (preferred)

### Enrichment Success Criteria
- 90%+ of inspectors with websites get enriched
- Logos display correctly on list and detail pages
- Detailed services show with descriptions and pricing
- Photos appear in gallery sections when available

### UI Synchronization
- Search page cities must match current data
- City pages show actual inspector counts
- Service filters include all collection phases
- No hardcoded references to old markets (Texas, etc.)

## Current Bay Area Status

### Cities with Data
- **San Francisco**: 22 inspectors collected
- **Oakland**: Data collection pending
- **San Jose**: Data collection pending  
- **Palo Alto**: Data collection pending

### Inspector Types Collected
- ✅ Home Inspectors (Phase 1 complete)
- ⏳ Termite/Pest Inspectors (Phase 2 pending)
- ⏳ Foundation Specialists (Phase 3 pending)
- ⏳ Specialty Inspectors (Phase 4 pending)
- ⏳ Commercial Inspectors (Phase 5 pending)

## Monitoring & Maintenance

### Daily Tasks
- Monitor enrichment success rates
- Verify website accessibility for pending inspectors
- Check for new inspector additions

### Weekly Tasks  
- Run visual verification tests
- Update city inspector counts on search page
- Analyze collection gaps and priorities

### Monthly Tasks
- Expand to new Bay Area cities
- Begin next inspector type collection phase
- Review and optimize search parameters

## Key Files

### Scripts
- `scripts/harvest-bay-area.js` - Data collection
- `scripts/fetch-websites-from-google.js` - Website discovery
- `scripts/enrich-inspector-data.js` - Data enrichment
- `scripts/visual-verification-test.js` - UI verification

### Configuration  
- `.claude/agents/data-strategy-specialist.md` - Collection strategy
- `.claude/agents/inspector-data-harvester.md` - Data collection
- `.claude/agents/listing-quality-manager.md` - Enrichment & quality

### UI Components
- `src/pages/search.js` - Find Inspectors page
- `src/pages/[state]/[city].js` - City directory pages
- `src/pages/inspectors/[id].js` - Inspector profiles
- `src/utils/cityData.js` - Dynamic city data sync

## Success Metrics
- **Data Coverage**: 80%+ of active inspectors per city
- **Enrichment Rate**: 90%+ successful logo/service extraction  
- **UI Accuracy**: 100% data synchronization between database and UI
- **Geographic Expansion**: 2-3 new cities per month
- **Quality Score**: 95%+ accuracy rate maintained