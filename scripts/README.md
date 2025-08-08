# Inspector Data Collection System

This directory contains the comprehensive data collection system for InspectorsNearMe.com, designed to efficiently gather and verify inspector listings from multiple sources.

## Overview

The system collects data for 1,000-5,000 residential property inspectors across non-licensed states, focusing on high-quality data with robust deduplication and verification.

## Files

### Core Scripts

- **`scrape-inspectors.js`** - Main scraping engine with multi-source data collection
- **`verify-data.js`** - Data quality verification and cleanup
- **`test-environment.js`** - Environment configuration testing
- **`demo-scraper.js`** - Demo data generator for testing

### Configuration

- **`.env`** - Environment variables (create from `.env.example`)
- **`../config/schema.sql`** - Database schema definition

## Features

### Data Sources
- Google Maps/Google Business listings
- Yellow Pages directory
- HomeAdvisor contractor listings
- Industry association directories (ASHI, InterNACHI)

### Data Quality
- Phone number validation and formatting
- Email address verification
- Website accessibility checking
- Address completeness validation
- Duplicate detection (phone, email, name+location)
- Spam filtering

### Geographic Coverage
22 non-licensed states with 5 priority cities each:
- Alabama, Alaska, Colorado, Delaware, Georgia
- Hawaii, Idaho, Iowa, Kansas, Maine
- Michigan, Minnesota, Missouri, Nebraska, New Hampshire
- New Mexico, Ohio, Pennsylvania, Utah, Vermont
- West Virginia, Wyoming

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - GOOGLE_MAPS_API_KEY
```

### 2. Test Configuration

```bash
npm run test-env
```

### 3. Generate Demo Data (Optional)

```bash
npm run demo-scraper
```

### 4. Run Data Collection

```bash
# Full collection and verification
npm run scrape-and-verify

# Or run individually
npm run scrape
npm run verify
```

## Scripts Detail

### scrape-inspectors.js

**Purpose**: Multi-source web scraping with rate limiting and deduplication

**Features**:
- Puppeteer-based Google Maps scraping
- Axios/Cheerio-based directory scraping
- Real-time deduplication
- Geocoding integration
- Batch database saves
- Comprehensive logging

**Configuration**:
- Target: 1,000+ inspectors
- Batch size: 25 records
- Rate limiting: 3-5 seconds between requests
- Geocoding: Google Maps API

**Usage**:
```bash
node scripts/scrape-inspectors.js
```

### verify-data.js

**Purpose**: Data quality assessment and cleanup

**Validation Checks**:
- Phone number format and validity
- Email address syntax
- Business name quality (spam detection)
- Address completeness
- Duplicate identification

**Metrics**:
- Quality score (target: >95%)
- Duplicate rate (target: <5%)
- Field completeness percentages
- Issue categorization

**Usage**:
```bash
node scripts/verify-data.js
```

### test-environment.js

**Purpose**: Verify API configuration before running scrapers

**Tests**:
- Environment variable presence
- Supabase connection
- Google Maps API functionality
- Database table access

**Usage**:
```bash
node scripts/test-environment.js
```

### demo-scraper.js

**Purpose**: Generate realistic test data without API calls

**Output**:
- JSON data file
- CSV for easy import
- Statistical summary
- 100+ realistic inspector records

**Usage**:
```bash
node scripts/demo-scraper.js
```

## Data Structure

Each inspector record includes:

```javascript
{
  business_name: "Accurate Home Inspections",
  owner_name: "John Smith", 
  email: "john@accuratehome.com",
  phone: "(205) 555-0123",
  website: "https://www.accuratehome.com",
  address_street: "123 Main Street",
  address_city: "Birmingham",
  address_state: "AL",
  address_zip: "35203",
  lat: 33.5186,
  lng: -86.8104,
  certifications: ["ASHI", "InterNACHI"],
  services: ["Home Inspection", "Radon Testing"],
  years_in_business: 12,
  license_number: "LIC12345",
  insurance_verified: true
}
```

## Performance Targets

- **Collection Rate**: 10+ listings per target city unit (TCU)
- **Data Accuracy**: 95%+ valid phone/email/address
- **Duplicate Rate**: <5%
- **Processing Speed**: 100+ inspectors per hour
- **Uptime**: Handles rate limiting and errors gracefully

## Logging and Monitoring

### Log Files
- `logs/scraping.log` - Main scraping activity
- `logs/verification.log` - Data quality checks
- `logs/scraping-summary.json` - Collection summary
- `logs/quality-report.json` - Data quality metrics

### Monitoring
- Real-time progress logging
- Error tracking and recovery
- Performance metrics
- Quality score calculations

## Error Handling

- **Network Issues**: Automatic retry with exponential backoff
- **Rate Limiting**: Intelligent delay adjustment
- **Invalid Data**: Skip and log for manual review
- **API Errors**: Graceful degradation to alternative sources

## Database Integration

Uses Supabase PostgreSQL with:
- Batch inserts for performance
- Individual fallback on batch failures
- Automatic timestamp management
- Foreign key relationship support

## Security Considerations

- User-Agent rotation
- Request rate limiting
- No personal data storage beyond business contact info
- Compliance with robots.txt where applicable
- Respectful scraping practices

## Troubleshooting

### Common Issues

1. **Environment Test Fails**
   - Verify .env file exists and has correct values
   - Check Supabase project URL and keys
   - Confirm Google Maps API key and billing

2. **Scraping Returns No Results**
   - Check internet connection
   - Verify target websites haven't changed structure
   - Review rate limiting settings

3. **Database Insert Errors**
   - Confirm Supabase table exists with correct schema
   - Check data types match schema requirements
   - Verify API key has write permissions

4. **Low Quality Scores**
   - Review data extraction logic
   - Adjust validation rules
   - Check source data quality

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true node scripts/scrape-inspectors.js
```

## Extending the System

### Adding New Sources
1. Create scraping function following existing patterns
2. Add to main loop in `scrapeInspectors()`
3. Include in deduplication logic
4. Update logging and metrics

### Custom Validation Rules
1. Add validation function to `verify-data.js`
2. Include in quality report generation
3. Update cleanup logic if needed

### Geographic Expansion
1. Add states to `TARGET_STATES` array
2. Update `PRIORITY_CITIES` object
3. Consider licensing requirements for new states

## Support

For issues or questions:
1. Check logs for specific error messages
2. Verify environment configuration
3. Review source website changes
4. Test with demo data first

## License

This code is proprietary to InspectorsNearMe.com and intended for internal use only.