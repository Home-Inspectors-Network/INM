# Bay Area SEO Content Generator

This guide explains how to use the Bay Area SEO content generator to create high-quality, location-specific pages for all Bay Area cities where you have inspector data.

## Overview

The Bay Area SEO generator uses Google Maps API for location intelligence to create comprehensive, SEO-optimized pages for each city in the San Francisco Bay Area where you have inspector listings.

## Features

- **Location Intelligence**: Uses Google Maps API to verify Bay Area counties and get accurate location data
- **Dynamic Content**: Generates unique, valuable content for each city based on actual inspector data
- **Local Schema Markup**: Includes structured data optimized for local search
- **Landmark Integration**: Automatically identifies local landmarks and points of interest
- **SEO Optimization**: Targets natural keyword density and follows SEO best practices

## Setup

### 1. Environment Variables

Ensure your `.env` file includes:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google Maps API (required for location intelligence)
GOOGLE_MAPS_API_KEY=AIzaSyCnvvjiDnTmWwrO77EDNOwVPYmbL9yaVcg
```

### 2. Database Setup

Ensure the `seo_pages` table exists:

```bash
npm run setup-db
```

Or manually run the SQL in `scripts/create-seo-table.sql`.

## Usage

### Generate Bay Area SEO Pages

Run the Bay Area-specific SEO generator:

```bash
npm run seo-bay-area
```

This will:
1. Query your database for all cities in California
2. Use Google Maps API to identify which cities are in Bay Area counties
3. Generate enhanced content for each Bay Area city
4. Store the pages in your `seo_pages` table

### Generated Content Structure

Each page includes:

- **Hero Section**: City-specific title and introduction
- **Local Information**: Bay Area-specific housing types and concerns
- **Inspector Listings**: Actual inspectors from your database
- **Service Information**: Detailed service descriptions
- **FAQ Section**: Local market-specific questions
- **Schema Markup**: Local business and FAQ structured data

### SEO Features

- **Target Keywords**: City + "home inspectors", location-specific variations
- **Local Schema**: Business listings, FAQs, and service markup
- **Internal Linking**: Links to inspector profiles and related pages
- **Mobile Optimization**: Responsive design with Tailwind CSS
- **Performance**: Optimized for Core Web Vitals

## Bay Area Counties Covered

The generator identifies cities in these Bay Area counties:

- Alameda County
- Contra Costa County
- Marin County
- Napa County
- San Francisco County
- San Mateo County
- Santa Clara County
- Solano County
- Sonoma County

## Content Customization

### City-Specific Data

The generator includes specialized content for major Bay Area cities:

- **San Francisco**: Victorian homes, seismic retrofitting, hill properties
- **Oakland**: Craftsman homes, wildfire risk, foundation issues
- **San Jose**: Tech worker housing, solar panels, clay soil
- **Berkeley**: Historic homes, hillside stability, university area
- **Palo Alto**: Luxury homes, Eichler properties, smart home tech

### Google Maps Integration

For each city, the system:
1. Geocodes the exact location
2. Identifies the specific county
3. Finds nearby landmarks and attractions
4. Validates Bay Area membership

## Monitoring and Reports

### Generation Logs

Check logs for detailed information:

```bash
tail -f logs/bay-area-seo-generation.log
```

### SEO Report

After generation, review the detailed report:

```bash
cat logs/bay-area-seo-report.json
```

## API Routes

### Dynamic Page Serving

Pages are served via Next.js dynamic routes:

- **Route**: `/[...slug].js`
- **API**: `/api/seo/[slug].js`
- **URL Format**: `/city-ca-home-inspectors`

### Example URLs

Generated pages will be accessible at:

- `/san-francisco-ca-home-inspectors`
- `/oakland-ca-home-inspectors`
- `/san-jose-ca-home-inspectors`
- `/berkeley-ca-home-inspectors`

## Performance Considerations

### API Rate Limits

The generator includes delays to respect Google Maps API rate limits:
- 200ms between location lookups
- 1000ms between complete city processing

### Caching

Consider implementing caching for production:
- Page-level caching in Next.js
- Database query optimization
- CDN for static assets

## Best Practices

### Content Quality

1. **Unique Value**: Each page provides genuine value for users
2. **Local Relevance**: Content addresses local market conditions
3. **Inspector Integration**: Real inspector data from your database
4. **Regular Updates**: Run generator when new inspectors are added

### SEO Optimization

1. **Keyword Targeting**: Natural integration of target keywords
2. **Schema Markup**: Comprehensive structured data
3. **Internal Linking**: Strategic links between pages
4. **Mobile-First**: Responsive design principles

### Monitoring

1. **Generation Logs**: Track successful and failed page generation
2. **SEO Scores**: Monitor calculated SEO scores for optimization
3. **Search Performance**: Track keyword rankings and traffic
4. **User Engagement**: Monitor bounce rate and session duration

## Troubleshooting

### Common Issues

1. **Google Maps API Errors**: Check API key and billing
2. **Database Connection**: Verify Supabase credentials
3. **Missing Cities**: Ensure inspector data includes valid city names
4. **Rate Limiting**: Increase delays if hitting API limits

### Error Handling

The generator includes comprehensive error handling:
- Failed city processing continues with other cities
- Detailed error logs for debugging
- Graceful fallbacks for missing data

## Future Enhancements

Consider these improvements:

1. **Automated Updates**: Schedule regular regeneration
2. **A/B Testing**: Test different content variations
3. **Performance Metrics**: Track SEO performance
4. **Content Expansion**: Add blog posts and service pages
5. **Multilingual Support**: Spanish content for California markets

## Support

For questions or issues:

1. Check the generation logs first
2. Verify environment variables
3. Test database connectivity
4. Validate Google Maps API access

The Bay Area SEO generator is designed to create high-quality, scalable content that drives organic traffic and helps users find qualified home inspectors in their area.