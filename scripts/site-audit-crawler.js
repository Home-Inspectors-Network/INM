const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class SiteAuditor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.visitedUrls = new Set();
    this.results = {
      totalLinks: 0,
      workingLinks: [],
      brokenLinks: [],
      redirects: [],
      timeouts: [],
      errors: [],
      apiEndpoints: {
        working: [],
        broken: []
      },
      functionalityTests: [],
      startTime: new Date(),
      endTime: null
    };
    this.queue = [baseUrl];
    this.maxDepth = 5;
    this.timeout = 10000; // 10 seconds timeout
  }

  async crawl() {
    console.log('🕷️  Starting comprehensive site audit...');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('─'.repeat(50));

    // Test key pages first
    await this.testKeyPages();
    
    // Test API endpoints
    await this.testApiEndpoints();
    
    // Crawl the site
    while (this.queue.length > 0) {
      const url = this.queue.shift();
      
      if (this.visitedUrls.has(url)) {
        continue;
      }
      
      await this.processUrl(url);
      
      // Rate limiting to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test search functionality
    await this.testSearchFunctionality();
    
    this.results.endTime = new Date();
    await this.generateReport();
  }

  async testKeyPages() {
    console.log('\n📋 Testing key pages...');
    
    const keyPages = [
      { path: '/', name: 'Homepage' },
      { path: '/cities', name: 'Cities Directory' },
      { path: '/search', name: 'Search Page' },
      { path: '/ca/san-francisco', name: 'City Page (San Francisco)' },
      { path: '/ca/los-angeles', name: 'City Page (Los Angeles)' },
      { path: '/ny/new-york', name: 'City Page (New York)' },
      { path: '/ca-home-inspectors', name: 'State Overview (California)' },
      { path: '/premium-upgrade', name: 'Premium Upgrade Page' }
    ];

    for (const page of keyPages) {
      const url = `${this.baseUrl}${page.path}`;
      const result = await this.testUrl(url);
      
      this.results.functionalityTests.push({
        name: page.name,
        url: url,
        status: result.status,
        success: result.success,
        error: result.error,
        responseTime: result.responseTime
      });
      
      console.log(`  ${result.success ? '✅' : '❌'} ${page.name}: ${result.status || result.error}`);
    }
  }

  async testApiEndpoints() {
    console.log('\n🔌 Testing API endpoints...');
    
    const apiEndpoints = [
      { path: '/api/inspectors/search?city=San Francisco&state=CA', name: 'Inspector Search' },
      { path: '/api/locations/nearby-cities?lat=37.7749&lng=-122.4194', name: 'Nearby Cities' },
      { path: '/api/sitemap', name: 'Sitemap API' },
      { path: '/api/seo/san-francisco-ca', name: 'SEO Data' },
      { path: '/api/memberships', name: 'Memberships' }
    ];

    for (const endpoint of apiEndpoints) {
      const url = `${this.baseUrl}${endpoint.path}`;
      const result = await this.testUrl(url, true);
      
      if (result.success) {
        this.results.apiEndpoints.working.push({
          name: endpoint.name,
          url: url,
          status: result.status,
          responseTime: result.responseTime
        });
      } else {
        this.results.apiEndpoints.broken.push({
          name: endpoint.name,
          url: url,
          status: result.status,
          error: result.error
        });
      }
      
      console.log(`  ${result.success ? '✅' : '❌'} ${endpoint.name}: ${result.status || result.error}`);
    }
  }

  async testSearchFunctionality() {
    console.log('\n🔍 Testing search functionality...');
    
    const searchTests = [
      { query: 'home inspection', name: 'Generic Search' },
      { query: 'San Francisco', name: 'City Search' },
      { query: '94105', name: 'ZIP Code Search' }
    ];

    for (const test of searchTests) {
      const url = `${this.baseUrl}/api/inspectors/search?q=${encodeURIComponent(test.query)}`;
      const result = await this.testUrl(url, true);
      
      this.results.functionalityTests.push({
        name: `Search: ${test.name}`,
        url: url,
        status: result.status,
        success: result.success,
        error: result.error,
        responseTime: result.responseTime,
        resultCount: result.data ? result.data.length : 0
      });
      
      console.log(`  ${result.success ? '✅' : '❌'} ${test.name}: ${result.status || result.error}`);
    }
  }

  async processUrl(url) {
    if (this.visitedUrls.has(url)) {
      return;
    }
    
    this.visitedUrls.add(url);
    this.results.totalLinks++;
    
    const result = await this.testUrl(url);
    
    if (result.success) {
      this.results.workingLinks.push({
        url: url,
        status: result.status,
        responseTime: result.responseTime
      });
      
      // Parse HTML for more links
      if (result.contentType && result.contentType.includes('text/html')) {
        await this.extractLinks(url, result.data);
      }
    } else if (result.status >= 300 && result.status < 400) {
      this.results.redirects.push({
        url: url,
        status: result.status,
        location: result.location
      });
    } else if (result.timeout) {
      this.results.timeouts.push({
        url: url,
        error: 'Timeout',
        responseTime: this.timeout
      });
    } else {
      this.results.brokenLinks.push({
        url: url,
        status: result.status,
        error: result.error
      });
    }
    
    // Progress indicator
    if (this.visitedUrls.size % 10 === 0) {
      console.log(`  Processed ${this.visitedUrls.size} URLs...`);
    }
  }

  async testUrl(url, isApi = false) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        timeout: this.timeout,
        validateStatus: () => true, // Accept all status codes
        headers: {
          'User-Agent': 'InspectorsNearMe Site Auditor'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        responseTime: responseTime,
        contentType: response.headers['content-type'],
        location: response.headers['location'],
        data: isApi ? response.data : response.data.toString()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          timeout: true,
          error: 'Timeout',
          responseTime: responseTime
        };
      }
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        responseTime: responseTime
      };
    }
  }

  async extractLinks(baseUrl, html) {
    try {
      const $ = cheerio.load(html);
      const links = new Set();
      
      // Extract all links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const absoluteUrl = this.resolveUrl(baseUrl, href);
          if (absoluteUrl && this.shouldCrawl(absoluteUrl)) {
            links.add(absoluteUrl);
          }
        }
      });
      
      // Add links to queue
      for (const link of links) {
        if (!this.visitedUrls.has(link) && !this.queue.includes(link)) {
          this.queue.push(link);
        }
      }
    } catch (error) {
      console.error(`Error extracting links from ${baseUrl}:`, error.message);
    }
  }

  resolveUrl(baseUrl, relativeUrl) {
    try {
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }
      
      if (relativeUrl.startsWith('//')) {
        return 'http:' + relativeUrl;
      }
      
      if (relativeUrl.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${relativeUrl}`;
      }
      
      // Handle relative paths
      const base = new URL(baseUrl);
      const resolved = new URL(relativeUrl, base);
      return resolved.toString();
    } catch (error) {
      return null;
    }
  }

  shouldCrawl(url) {
    // Only crawl URLs from the same domain
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(this.baseUrl);
      
      // Skip external links
      if (urlObj.hostname !== baseObj.hostname) {
        return false;
      }
      
      // Skip certain file types
      const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.exe'];
      if (skipExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
        return false;
      }
      
      // Skip certain paths
      const skipPaths = ['/logout', '/admin', '/_next'];
      if (skipPaths.some(path => url.includes(path))) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    
    const report = {
      executiveSummary: {
        totalLinksFound: this.results.totalLinks,
        workingLinks: this.results.workingLinks.length,
        brokenLinks: this.results.brokenLinks.length,
        redirects: this.results.redirects.length,
        timeouts: this.results.timeouts.length,
        crawlDuration: `${duration.toFixed(2)} seconds`,
        timestamp: new Date().toISOString()
      },
      
      criticalIssues: [],
      highPriorityIssues: [],
      mediumPriorityIssues: [],
      lowPriorityIssues: [],
      
      detailedFindings: {
        brokenLinks: this.results.brokenLinks,
        timeouts: this.results.timeouts,
        redirects: this.results.redirects,
        apiEndpoints: this.results.apiEndpoints,
        functionalityTests: this.results.functionalityTests
      },
      
      recommendations: []
    };
    
    // Categorize issues by priority
    this.categorizeIssues(report);
    
    // Generate recommendations
    this.generateRecommendations(report);
    
    // Save report
    const reportPath = path.join(__dirname, '../logs/site-audit-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    // Generate human-readable report
    await this.generateHumanReadableReport(report);
    
    console.log('\n✅ Audit complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  categorizeIssues(report) {
    // Critical issues
    if (this.results.brokenLinks.some(link => link.url === this.baseUrl || link.url === `${this.baseUrl}/`)) {
      report.criticalIssues.push({
        type: 'Homepage Down',
        description: 'The homepage is not accessible',
        impact: 'Users cannot access the site'
      });
    }
    
    const brokenApiEndpoints = this.results.apiEndpoints.broken.length;
    if (brokenApiEndpoints > 0) {
      report.criticalIssues.push({
        type: 'API Failures',
        description: `${brokenApiEndpoints} API endpoints are not working`,
        impact: 'Core functionality is broken',
        endpoints: this.results.apiEndpoints.broken
      });
    }
    
    // High priority issues
    const brokenCityPages = this.results.brokenLinks.filter(link => 
      link.url.match(/\/[a-z]{2}\/[a-z-]+$/)
    );
    if (brokenCityPages.length > 0) {
      report.highPriorityIssues.push({
        type: 'Broken City Pages',
        description: `${brokenCityPages.length} city pages are not accessible`,
        impact: 'Users cannot find inspectors in specific cities',
        examples: brokenCityPages.slice(0, 5)
      });
    }
    
    // Medium priority issues
    if (this.results.timeouts.length > 5) {
      report.mediumPriorityIssues.push({
        type: 'Performance Issues',
        description: `${this.results.timeouts.length} pages are timing out`,
        impact: 'Poor user experience due to slow loading',
        examples: this.results.timeouts.slice(0, 5)
      });
    }
    
    // Low priority issues
    if (this.results.redirects.length > 0) {
      report.lowPriorityIssues.push({
        type: 'Redirects',
        description: `${this.results.redirects.length} redirects found`,
        impact: 'Minor SEO and performance impact',
        examples: this.results.redirects.slice(0, 5)
      });
    }
  }

  generateRecommendations(report) {
    if (report.criticalIssues.length > 0) {
      report.recommendations.push({
        priority: 'CRITICAL',
        action: 'Fix all critical issues immediately',
        details: 'Homepage and API endpoints must be functional for the site to work'
      });
    }
    
    if (this.results.brokenLinks.length > 10) {
      report.recommendations.push({
        priority: 'HIGH',
        action: 'Implement 404 error handling',
        details: 'Create a custom 404 page and fix broken internal links'
      });
    }
    
    if (this.results.timeouts.length > 0) {
      report.recommendations.push({
        priority: 'MEDIUM',
        action: 'Optimize page load performance',
        details: 'Investigate and fix pages that are timing out'
      });
    }
    
    if (this.results.apiEndpoints.broken.length > 0) {
      report.recommendations.push({
        priority: 'CRITICAL',
        action: 'Fix broken API endpoints',
        details: 'Ensure database connections and environment variables are properly configured'
      });
    }
  }

  async generateHumanReadableReport(report) {
    let markdown = '# InspectorsNearMe.com Site Audit Report\n\n';
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    markdown += '## Executive Summary\n\n';
    markdown += `- **Total Links Scanned**: ${report.executiveSummary.totalLinksFound}\n`;
    markdown += `- **Working Links**: ${report.executiveSummary.workingLinks} ✅\n`;
    markdown += `- **Broken Links**: ${report.executiveSummary.brokenLinks} ❌\n`;
    markdown += `- **Redirects**: ${report.executiveSummary.redirects} ↪️\n`;
    markdown += `- **Timeouts**: ${report.executiveSummary.timeouts} ⏱️\n`;
    markdown += `- **Crawl Duration**: ${report.executiveSummary.crawlDuration}\n\n`;
    
    // Critical Issues
    if (report.criticalIssues.length > 0) {
      markdown += '## 🚨 CRITICAL Issues\n\n';
      report.criticalIssues.forEach(issue => {
        markdown += `### ${issue.type}\n`;
        markdown += `- **Description**: ${issue.description}\n`;
        markdown += `- **Impact**: ${issue.impact}\n\n`;
      });
    }
    
    // High Priority Issues
    if (report.highPriorityIssues.length > 0) {
      markdown += '## ⚠️ HIGH Priority Issues\n\n';
      report.highPriorityIssues.forEach(issue => {
        markdown += `### ${issue.type}\n`;
        markdown += `- **Description**: ${issue.description}\n`;
        markdown += `- **Impact**: ${issue.impact}\n\n`;
      });
    }
    
    // Broken Links Details
    if (this.results.brokenLinks.length > 0) {
      markdown += '## Broken Links (Top 10)\n\n';
      this.results.brokenLinks.slice(0, 10).forEach(link => {
        markdown += `- ${link.url} - ${link.status || link.error}\n`;
      });
      markdown += '\n';
    }
    
    // API Status
    markdown += '## API Endpoint Status\n\n';
    markdown += '### ✅ Working Endpoints\n';
    report.detailedFindings.apiEndpoints.working.forEach(api => {
      markdown += `- ${api.name}: ${api.status} (${api.responseTime}ms)\n`;
    });
    markdown += '\n### ❌ Broken Endpoints\n';
    report.detailedFindings.apiEndpoints.broken.forEach(api => {
      markdown += `- ${api.name}: ${api.error || api.status}\n`;
    });
    
    // Recommendations
    markdown += '\n## Recommendations\n\n';
    report.recommendations.forEach(rec => {
      markdown += `### ${rec.priority}: ${rec.action}\n`;
      markdown += `${rec.details}\n\n`;
    });
    
    const reportPath = path.join(__dirname, '../logs/site-audit-report.md');
    await fs.writeFile(reportPath, markdown);
    console.log(`📝 Human-readable report saved to: ${reportPath}`);
  }
}

// Run the audit
async function main() {
  const auditor = new SiteAuditor('http://localhost:3000');
  await auditor.crawl();
}

main().catch(console.error);