# InspectorsNearMe.com - MVP Collection Strategy

## Business Model: Top 10 Directory

### Why Top 10?
- **Revenue Optimization**: 10 premium spots @ $79-299/month = $790-2,990/city
- **Category Coverage**: Room for all inspector types
- **Market Standard**: Familiar model (Yelp, Google)
- **Competitive Dynamics**: Creates urgency for top spots

## Inspector Categories & Distribution

### Standard City Distribution (10 slots):
1. **General Home Inspectors** (4 slots) - 40%
2. **Termite/Pest Inspectors** (2 slots) - 20%
3. **Mold Inspectors** (1 slot) - 10%
4. **Foundation/Structural** (1 slot) - 10%
5. **Pool/Spa OR Radon** (1 slot) - 10% (regional)
6. **Commercial/Multi-family** (1 slot) - 10%

### Regional Variations:
- **Houston/South**: More termite inspectors (3 slots)
- **California**: Pool/spa inspectors prioritized
- **Northeast**: Radon testing prioritized
- **Florida**: Mold inspectors (2 slots)

## MVP Quality Standards

### Minimum Requirements (65 points):
- ✅ Business name + address (15 pts)
- ✅ Working phone number (10 pts)
- ✅ Email OR website (10 pts)
- ✅ 2+ services listed (10 pts)
- ✅ Verified active (10 pts)
- ✅ City/state accurate (10 pts)

### Preferred Additions:
- Website with details (+10 pts)
- Business hours (+5 pts)
- Logo/photos (+5 pts)
- Certifications (+5 pts)
- Years in business (+5 pts)

## Phased City Rollout

### Phase 1: Core Markets (Week 1)
**Goal**: 50 inspectors, 100% complete NAP
1. New York City - 10 inspectors
2. Los Angeles - 10 inspectors
3. Chicago - 10 inspectors
4. Houston - 10 inspectors
5. Phoenix - 10 inspectors

### Phase 2: Major Cities (Week 1-2)
**Goal**: 50 more inspectors
6. Philadelphia - 10 inspectors
7. San Antonio - 10 inspectors
8. San Diego - 10 inspectors
9. Dallas - 10 inspectors
10. San Jose - 10 inspectors

### Phase 3: Growth Markets (Week 2)
**Goal**: 50 more inspectors
11. San Francisco - 10 inspectors
12. Seattle - 10 inspectors
13. Austin - 10 inspectors
14. Denver - 10 inspectors
15. Boston - 10 inspectors

**Total MVP**: 150 premium inspectors

## Collection Workflow

### Step 1: Data Harvesting (Per City)
```bash
# Deploy inspector-data-harvester
1. Search "home inspectors [city] [state]" (target: 4)
2. Search "termite inspectors [city]" (target: 2)
3. Search "mold inspection [city]" (target: 1)
4. Search "foundation inspectors [city]" (target: 1)
5. Search "[specialty] inspectors [city]" (target: 1)
6. Search "commercial property inspectors [city]" (target: 1)
```

### Step 2: Quality Filtering
- Remove duplicates
- Verify active businesses
- Check ratings (4.0+ preferred)
- Confirm local address
- Score quality (65+ points)

### Step 3: Enrichment
```bash
# Deploy listing-quality-manager
1. Find missing phone numbers
2. Find missing websites/emails
3. Extract service lists
4. Get business hours
5. Grab logo if available
```

### Step 4: Final Validation
- Ensure exactly 10 per city
- Verify category distribution
- Confirm 100% have contactable info
- Quality check scores

## Success Metrics

### MVP Launch Requirements:
- ✅ 15 cities with 10 inspectors each
- ✅ 100% complete contact information
- ✅ All 6 categories represented
- ✅ Average quality score: 70+
- ✅ Zero broken inspector pages

### Revenue Projections:
- **Conservative**: 3 premium spots/city @ $99/mo = $4,455/mo
- **Moderate**: 5 premium spots/city @ $149/mo = $11,175/mo
- **Aggressive**: 7 premium spots/city @ $199/mo = $20,895/mo

## Agent Updates Required

### inspector-data-harvester:
- Reduce targets to 10 total per city
- Add category-specific search queries
- Implement 65-point quality threshold

### listing-quality-manager:
- Simplify enrichment to core NAP data
- Lower quality threshold to 65 points
- Focus on contact info completion

### parallel-expansion-coordinator:
- Add phased city rollout logic
- Limit to 3 cities concurrent
- Implement completion verification

---
*Ready to deploy with focused Top 10 model*