# InspectorsNearMe.com Sitemap System

This comprehensive sitemap system automatically generates, validates, and maintains XML sitemaps for optimal SEO performance.

## 🚀 Quick Start

### Generate Sitemaps
```bash
# Generate all sitemaps
npm run sitemap

# Validate existing sitemaps  
npm run sitemap-validate

# Run automated cron job
npm run sitemap-cron

# Check sitemap health
npm run sitemap-health

# Force regeneration
npm run sitemap-force
```

## 📁 System Components

### Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `sitemap-builder.js` | Main sitemap generation engine | `/scripts/sitemap-builder.js` |
| `sitemap-validator.js` | Validation and quality checks | `/scripts/sitemap-validator.js` |
| `sitemap-cron.js` | Automated maintenance cron job | `/scripts/sitemap-cron.js` |

### API Endpoints

| Endpoint | Purpose | File |
|----------|---------|------|
| `/api/sitemap` | Dynamic sitemap generation | `/src/pages/api/sitemap.js` |

### Generated Files

| File | Description | Location |
|------|-------------|----------|
| `sitemap.xml` | Main sitemap with all URLs | `/public/sitemap.xml` |
| `sitemap-index.xml` | Sitemap index for large sites | `/public/sitemap-index.xml` |
| `sitemap-images.xml` | Image-specific sitemap | `/public/sitemap-images.xml` |
| `robots.txt` | Search engine directives | `/public/robots.txt` |
| `sitemaps/city-pages.xml` | City-specific pages | `/public/sitemaps/city-pages.xml` |
| `sitemaps/inspectors.xml` | Inspector profile pages | `/public/sitemaps/inspectors.xml` |

## 🛠️ Features

### ✅ Comprehensive URL Coverage
- **Static Pages**: Homepage, about, contact, services
- **Dynamic City Pages**: From `seo_pages` table (city-specific landing pages)
- **State Pages**: State-level overview pages
- **Inspector Profiles**: Individual inspector pages from database
- **Service Pages**: Predefined service type pages
- **Blog Posts**: Blog content (if available)

### ✅ SEO Optimization
- **Priority Scoring**: Strategic priority assignment
  - Homepage: 1.0
  - Main pages: 0.9
  - City pages: 0.8
  - State pages: 0.7
  - Inspector profiles: 0.6
  - Service pages: 0.5
  - Blog posts: 0.4

- **Change Frequencies**: Appropriate update frequencies
  - Homepage: daily
  - City/main pages: weekly
  - Inspector profiles: monthly
  - Service pages: monthly

- **Last Modified Dates**: Accurate timestamps from database

### ✅ Scalability Features
- **Separate Sitemaps**: Auto-splits large sitemaps (>10,000 URLs)
- **Sitemap Index**: Manages multiple sitemap files
- **Compression Ready**: Supports gzipped sitemaps
- **Caching**: API endpoint includes cache headers

### ✅ Quality Assurance
- **XML Validation**: Ensures proper XML structure
- **URL Validation**: Checks URL format and accessibility
- **Content Validation**: Verifies priority values and change frequencies
- **Size Limits**: Enforces 50,000 URL and 50MB limits

### ✅ Search Engine Integration
- **robots.txt Generation**: Includes sitemap directives
- **Google Search Console**: Submission URL generation
- **Bing Webmaster**: Submission support
- **Image Sitemaps**: Enhanced image SEO

### ✅ Monitoring & Alerting
- **Health Checks**: Automated sitemap health monitoring
- **Validation Reports**: Detailed quality reports
- **Error Tracking**: Comprehensive logging
- **Notification System**: Alert integration (configurable)

## 🔧 Configuration

### Environment Variables
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://inspectorsnearme.com

# Optional - for notifications
SENDGRID_API_KEY=your-sendgrid-key
ADMIN_EMAIL=admin@inspectorsnearme.com
```

### Database Requirements
The system requires these tables:
- `inspectors` - Inspector profiles
- `seo_pages` - City and state pages
- `blog_posts` - Blog content (optional)

## 📊 URL Structure

### Static Pages
```
/                           (Priority: 1.0, Daily)
/about                      (Priority: 0.9, Weekly)
/contact                    (Priority: 0.9, Weekly)
/services                   (Priority: 0.9, Weekly)
/inspectors                 (Priority: 0.9, Weekly)
```

### Dynamic Pages
```
/{city}-{state}-home-inspectors    (Priority: 0.8, Weekly)
/{state}-home-inspectors           (Priority: 0.7, Monthly)
/inspector/{id}                    (Priority: 0.6, Monthly)
/services/{service-type}           (Priority: 0.5, Monthly)
/blog/{slug}                       (Priority: 0.4, Weekly)
```

## 🔄 Automation

### Cron Job Setup
```bash
# Daily sitemap regeneration at 2 AM
0 2 * * * /usr/bin/node /path/to/scripts/sitemap-cron.js

# Weekly validation
0 3 * * 0 /usr/bin/node /path/to/scripts/sitemap-cron.js health
```

### Manual Commands
```bash
# Generate new sitemaps
npm run sitemap

# Validate existing sitemaps
npm run sitemap-validate

# Health check
npm run sitemap-health

# Force regeneration (ignores freshness check)
npm run sitemap-force

# Run cron job manually
npm run sitemap-cron
```

## 📈 Performance Monitoring

### Logs Location
- Generation logs: `/logs/sitemap-generation.log`
- Validation logs: `/logs/sitemap-validation.log`
- Cron logs: `/logs/sitemap-cron.log`

### Reports Location
- SEO report: `/logs/sitemap-report.json`
- Validation report: `/logs/sitemap-validation-report.json`

### Key Metrics
- Total URLs generated
- URLs by type breakdown
- Validation success rate
- Generation time
- File sizes

## 🚨 Troubleshooting

### Common Issues

#### Sitemap Not Generating
```bash
# Check database connection
npm run verify-db

# Check environment variables
node -e "console.log(process.env.SUPABASE_URL)"

# Force regeneration
npm run sitemap-force
```

#### Validation Failures
```bash
# Run detailed validation
npm run sitemap-validate

# Check log files
tail -f logs/sitemap-validation.log
```

#### Large Site Performance
- System automatically creates separate sitemaps for 10,000+ URLs
- Use sitemap index for sites with multiple sitemaps
- Consider database indexing for faster queries

### Error Codes
- **XML001**: Invalid XML structure
- **URL001**: Invalid URL format
- **SIZE001**: File size exceeds limits
- **COUNT001**: Too many URLs in single sitemap

## 🔗 Search Engine Submission

### Automatic Submission
The system generates submission URLs:
```
Google: https://www.google.com/ping?sitemap={sitemap_url}
Bing: https://www.bing.com/ping?sitemap={sitemap_url}
```

### Manual Submission
1. Google Search Console: Property → Sitemaps → Add/test sitemap
2. Bing Webmaster Tools: Site → Sitemaps → Submit sitemap

### Verification
```bash
# Test sitemap accessibility
curl -I https://inspectorsnearme.com/sitemap.xml

# Check robots.txt
curl https://inspectorsnearme.com/robots.txt
```

## 📝 API Usage

### Dynamic Sitemap Endpoint
```javascript
// GET /api/sitemap
// Returns XML sitemap with current data
// Includes cache headers for performance
```

### Integration Example
```javascript
// Next.js page integration
export async function getServerSideProps() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sitemap`);
  const sitemap = await response.text();
  return { props: { sitemap } };
}
```

## 🔒 Security Considerations

- Only public URLs included in sitemaps
- No sensitive or admin routes exposed
- Rate limiting on API endpoints
- Proper error handling prevents information leakage

## 🎯 SEO Best Practices

### Implemented
- ✅ XML namespace declarations
- ✅ Proper priority scoring
- ✅ Accurate last modified dates
- ✅ Reasonable change frequencies
- ✅ Image sitemap support
- ✅ robots.txt integration
- ✅ Compression ready
- ✅ Mobile-friendly URLs

### Recommendations
- Monitor Google Search Console for crawl errors
- Update change frequencies based on actual content updates
- Use priority scores to guide important pages
- Submit sitemaps after major site changes

## 📞 Support

### Log Analysis
```bash
# View recent generation activity
tail -100 logs/sitemap-generation.log

# Monitor validation issues
grep "ERROR\|WARNING" logs/sitemap-validation.log

# Check cron job status
tail -50 logs/sitemap-cron.log
```

### Debug Mode
Add `DEBUG=sitemap*` to enable detailed logging:
```bash
DEBUG=sitemap* npm run sitemap
```

---

## 🚀 Quick Commands Reference

```bash
# Essential commands
npm run sitemap           # Generate sitemaps
npm run sitemap-validate  # Validate sitemaps
npm run sitemap-health    # Health check

# Maintenance commands
npm run sitemap-cron      # Run cron job
npm run sitemap-force     # Force regeneration

# Monitoring
tail -f logs/sitemap-generation.log
tail -f logs/sitemap-validation.log
```

This sitemap system ensures your InspectorsNearMe.com website maintains optimal search engine visibility with automated, validated, and comprehensive sitemaps.