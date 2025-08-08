# Optimized Collection Strategy

## Key Improvements

### 1. Focused Search Strategy
We now target the most valuable sources for inspector listings:
- **Google's top 10 results** - Where inspectors compete for visibility
- **Yelp business pages** - Verified businesses with reviews
- **ThreeBestRated.com** - Curated top 3 businesses per category
- **Business directories** - HomeAdvisor, Angi, BBB, Thumbtack profiles

### 2. Reduced Exclusions
Only excluding non-business content:
- Search result pages (google.com/search, yelp.com/search)
- Non-business sites (Wikipedia, Reddit, YouTube, .gov)
- Job sites (Indeed, Glassdoor)
- Community sites (Nextdoor, Craigslist)

### 3. Targeted Queries
Each category now includes:
```
- General search: "mold inspector Houston TX"
- Local search: "mold testing Houston"
- Yelp-specific: "site:yelp.com mold inspection Houston"
- ThreeBestRated: "site:threebestrated.com mold testing Houston"
```

## Benefits

1. **Higher Quality Results** - Focus on actual business listings, not search pages
2. **Better Coverage** - Include all major business directories
3. **Efficient Credit Usage** - Scrape only valuable business pages
4. **Competitive Intelligence** - Get the same top 10 that customers see

## Collection Process

### Per City (10 inspectors target):
1. Search with 4 targeted queries
2. Get 10 results per query = 40 potential URLs
3. Filter for business listings only
4. Scrape top 10-15 unique business pages
5. Extract and save inspector data

### Expected Results:
- **Better data quality** - Real business pages with complete info
- **Faster collection** - No wasted credits on search pages
- **More accurate Top 10** - Matches what customers actually find

## Running the Collection

```bash
# Single category
node scripts/collect-single-category.js mold

# All remaining categories
for category in mold foundation pool radon commercial specialty; do
  echo "Collecting $category inspectors..."
  node scripts/collect-single-category.js $category
  echo "Waiting 60 seconds before next category..."
  sleep 60
done
```

## Monitoring Progress

The script will show:
- URLs found per city
- Successful scrapes
- Inspectors saved to database
- Any errors encountered

With 100 requests/minute rate limit, each category should complete in 10-15 minutes.