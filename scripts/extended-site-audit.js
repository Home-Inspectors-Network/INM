const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class ExtendedSiteAuditor {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.visitedUrls = new Set();
    this.results = {
      pages: {
        total: 0,
        working: [],
        broken: [],
        slow: []
      },
      apis: {
        total: 0,
        working: [],
        broken: []
      },
      inspectorProfiles: {
        tested: [],
        working: 0,
        broken: 0
      },
      forms: {
        tested: [],
        working: 0,
        broken: 0
      },
      seo: {
        missingMeta: [],
        missingH1: [],
        multipleH1: []
      },
      performance: {
        slowPages: [],
        averageLoadTime: 0
      },
      accessibility: {
        missingAltText: [],
        missingLabels: []
      }
    };
  }

  async audit() {
    console.log('🔍 Starting Extended Site Audit...\n');
    
    // 1. Test State Pages
    await this.testStatePages();
    
    // 2. Test Major Cities
    await this.testMajorCities();
    
    // 3. Test Inspector Profiles
    await this.testInspectorProfiles();
    
    // 4. Test Forms and Interactive Elements
    await this.testForms();
    
    // 5. Test Additional API Endpoints
    await this.testAdvancedAPIs();
    
    // 6. SEO Analysis
    await this.performSEOAnalysis();
    
    // 7. Performance Analysis
    await this.analyzePerformance();
    
    // Generate comprehensive report
    await this.generateDetailedReport();
  }

  async testStatePages() {
    console.log('📍 Testing state overview pages...');
    
    const states = [
      { code: 'ca', name: 'California' },
      { code: 'ny', name: 'New York' },
      { code: 'tx', name: 'Texas' },
      { code: 'fl', name: 'Florida' },
      { code: 'il', name: 'Illinois' },
      { code: 'pa', name: 'Pennsylvania' },
      { code: 'az', name: 'Arizona' },
      { code: 'wa', name: 'Washington' },
      { code: 'ma', name: 'Massachusetts' },
      { code: 'co', name: 'Colorado' }
    ];

    for (const state of states) {
      const url = `${this.baseUrl}/${state.code}-home-inspectors`;
      const result = await this.testPage(url);
      
      if (result.success) {
        this.results.pages.working.push({
          url,
          type: 'state-overview',
          state: state.name,
          loadTime: result.loadTime
        });
      } else {
        this.results.pages.broken.push({
          url,
          type: 'state-overview',
          state: state.name,
          error: result.error
        });
      }
      
      console.log(`  ${result.success ? '✅' : '❌'} ${state.name}: ${result.status || result.error}`);
    }
  }

  async testMajorCities() {
    console.log('\n🏙️  Testing major city pages...');
    
    const cities = [
      { state: 'ca', city: 'san-francisco', name: 'San Francisco, CA' },
      { state: 'ca', city: 'los-angeles', name: 'Los Angeles, CA' },
      { state: 'ca', city: 'san-diego', name: 'San Diego, CA' },
      { state: 'ca', city: 'san-jose', name: 'San Jose, CA' },
      { state: 'ny', city: 'new-york', name: 'New York, NY' },
      { state: 'ny', city: 'buffalo', name: 'Buffalo, NY' },
      { state: 'tx', city: 'houston', name: 'Houston, TX' },
      { state: 'tx', city: 'dallas', name: 'Dallas, TX' },
      { state: 'tx', city: 'austin', name: 'Austin, TX' },
      { state: 'fl', city: 'miami', name: 'Miami, FL' },
      { state: 'fl', city: 'orlando', name: 'Orlando, FL' },
      { state: 'il', city: 'chicago', name: 'Chicago, IL' },
      { state: 'pa', city: 'philadelphia', name: 'Philadelphia, PA' },
      { state: 'az', city: 'phoenix', name: 'Phoenix, AZ' },
      { state: 'wa', city: 'seattle', name: 'Seattle, WA' }
    ];

    for (const city of cities) {
      const url = `${this.baseUrl}/${city.state}/${city.city}`;
      const result = await this.testPage(url);
      
      if (result.success) {
        this.results.pages.working.push({
          url,
          type: 'city',
          location: city.name,
          loadTime: result.loadTime
        });
        
        // Check for inspectors on the page
        if (result.html) {
          const $ = cheerio.load(result.html);
          const inspectorCount = $('.inspector-card, [data-inspector-id]').length;
          console.log(`    └─ Found ${inspectorCount} inspectors`);
        }
      } else {
        this.results.pages.broken.push({
          url,
          type: 'city',
          location: city.name,
          error: result.error
        });
      }
      
      console.log(`  ${result.success ? '✅' : '❌'} ${city.name}: ${result.status || result.error}`);
    }
  }

  async testInspectorProfiles() {
    console.log('\n👤 Testing inspector profile pages...');
    
    // First, get some inspector IDs from search
    try {
      const searchUrl = `${this.baseUrl}/api/inspectors/search?city=San Francisco&state=CA&limit=5`;
      const response = await axios.get(searchUrl);
      
      if (response.data && Array.isArray(response.data)) {
        for (const inspector of response.data.slice(0, 5)) {
          // Test by ID
          const idUrl = `${this.baseUrl}/api/inspectors/${inspector.id}`;
          const idResult = await this.testPage(idUrl, true);
          
          this.results.inspectorProfiles.tested.push({
            url: idUrl,
            inspectorName: inspector.name,
            success: idResult.success,
            error: idResult.error
          });
          
          if (idResult.success) {
            this.results.inspectorProfiles.working++;
          } else {
            this.results.inspectorProfiles.broken++;
          }
          
          // Test by slug if available
          if (inspector.slug) {
            const slugUrl = `${this.baseUrl}/api/inspectors/by-slug/${inspector.slug}`;
            const slugResult = await this.testPage(slugUrl, true);
            
            console.log(`  ${slugResult.success ? '✅' : '❌'} Inspector ${inspector.name} (${inspector.slug})`);
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Could not test inspector profiles: ${error.message}`);
    }
  }

  async testForms() {
    console.log('\n📝 Testing forms and interactive elements...');
    
    // Test search form
    const searchTests = [
      {
        name: 'Search by city',
        url: `${this.baseUrl}/api/inspectors/search`,
        params: { city: 'San Francisco', state: 'CA' }
      },
      {
        name: 'Search by ZIP',
        url: `${this.baseUrl}/api/inspectors/search`,
        params: { zip: '94105' }
      },
      {
        name: 'Lead submission',
        url: `${this.baseUrl}/api/leads`,
        method: 'POST',
        data: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '555-0123',
          message: 'Test message',
          inspectorId: 1
        }
      }
    ];

    for (const test of searchTests) {
      try {
        const config = {
          method: test.method || 'GET',
          url: test.url,
          params: test.params,
          data: test.data
        };
        
        const response = await axios(config);
        
        this.results.forms.tested.push({
          name: test.name,
          success: true,
          status: response.status
        });
        this.results.forms.working++;
        
        console.log(`  ✅ ${test.name}: ${response.status}`);
      } catch (error) {
        this.results.forms.tested.push({
          name: test.name,
          success: false,
          error: error.message
        });
        this.results.forms.broken++;
        
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testAdvancedAPIs() {
    console.log('\n🔧 Testing advanced API endpoints...');
    
    const apiTests = [
      {
        name: 'Inspector reviews',
        url: `${this.baseUrl}/api/inspectors/1/reviews`
      },
      {
        name: 'Stripe webhook',
        url: `${this.baseUrl}/api/stripe/webhook`,
        method: 'POST',
        headers: { 'stripe-signature': 'test' },
        data: { type: 'test' }
      },
      {
        name: 'Create subscription',
        url: `${this.baseUrl}/api/stripe/create-subscription`,
        method: 'POST',
        data: {
          priceId: 'test_price',
          inspectorId: 1
        }
      }
    ];

    for (const test of apiTests) {
      try {
        const response = await axios({
          method: test.method || 'GET',
          url: test.url,
          headers: test.headers || {},
          data: test.data,
          validateStatus: () => true
        });
        
        const success = response.status < 400;
        
        if (success) {
          this.results.apis.working.push({
            name: test.name,
            url: test.url,
            status: response.status
          });
        } else {
          this.results.apis.broken.push({
            name: test.name,
            url: test.url,
            status: response.status
          });
        }
        
        console.log(`  ${success ? '✅' : '❌'} ${test.name}: ${response.status}`);
      } catch (error) {
        this.results.apis.broken.push({
          name: test.name,
          url: test.url,
          error: error.message
        });
        
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async performSEOAnalysis() {
    console.log('\n🔍 Performing SEO analysis...');
    
    const pagesToAnalyze = [
      `${this.baseUrl}/`,
      `${this.baseUrl}/ca/san-francisco`,
      `${this.baseUrl}/cities`,
      `${this.baseUrl}/search`
    ];

    for (const url of pagesToAnalyze) {
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Check meta tags
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content');
        const h1Count = $('h1').length;
        
        if (!title || title.length < 10) {
          this.results.seo.missingMeta.push({
            url,
            issue: 'Missing or short title tag'
          });
        }
        
        if (!description || description.length < 50) {
          this.results.seo.missingMeta.push({
            url,
            issue: 'Missing or short meta description'
          });
        }
        
        if (h1Count === 0) {
          this.results.seo.missingH1.push(url);
        } else if (h1Count > 1) {
          this.results.seo.multipleH1.push({
            url,
            count: h1Count
          });
        }
        
        console.log(`  ✅ Analyzed ${url}`);
      } catch (error) {
        console.log(`  ❌ Could not analyze ${url}: ${error.message}`);
      }
    }
  }

  async analyzePerformance() {
    console.log('\n⚡ Analyzing performance...');
    
    const allLoadTimes = [];
    
    // Collect all load times from previous tests
    this.results.pages.working.forEach(page => {
      if (page.loadTime) {
        allLoadTimes.push(page.loadTime);
        
        if (page.loadTime > 3000) {
          this.results.performance.slowPages.push({
            url: page.url,
            loadTime: page.loadTime,
            type: page.type
          });
        }
      }
    });
    
    if (allLoadTimes.length > 0) {
      this.results.performance.averageLoadTime = 
        allLoadTimes.reduce((a, b) => a + b, 0) / allLoadTimes.length;
      
      console.log(`  Average page load time: ${this.results.performance.averageLoadTime.toFixed(0)}ms`);
      console.log(`  Slow pages (>3s): ${this.results.performance.slowPages.length}`);
    }
  }

  async testPage(url, isApi = false) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        timeout: 10000,
        validateStatus: () => true
      });
      
      const loadTime = Date.now() - startTime;
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        loadTime: loadTime,
        html: !isApi ? response.data : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        loadTime: Date.now() - startTime
      };
    }
  }

  async generateDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        pagesScanned: this.results.pages.working.length + this.results.pages.broken.length,
        workingPages: this.results.pages.working.length,
        brokenPages: this.results.pages.broken.length,
        apisWorking: this.results.apis.working.length,
        apisBroken: this.results.apis.broken.length,
        inspectorProfilesWorking: this.results.inspectorProfiles.working,
        inspectorProfilesBroken: this.results.inspectorProfiles.broken,
        formsWorking: this.results.forms.working,
        formsBroken: this.results.forms.broken,
        averageLoadTime: this.results.performance.averageLoadTime,
        slowPages: this.results.performance.slowPages.length,
        seoIssues: this.results.seo.missingMeta.length + 
                   this.results.seo.missingH1.length + 
                   this.results.seo.multipleH1.length
      },
      details: this.results
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, '../logs/extended-audit-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    // Generate summary report
    await this.generateSummaryReport(report);
    
    console.log(`\n✅ Extended audit complete!`);
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  async generateSummaryReport(report) {
    let markdown = '# Extended Site Audit Report - InspectorsNearMe.com\n\n';
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    markdown += '## Executive Summary\n\n';
    markdown += '### Overall Health Score: ';
    
    const healthScore = this.calculateHealthScore(report);
    if (healthScore >= 90) markdown += '🟢 Excellent\n';
    else if (healthScore >= 75) markdown += '🟡 Good\n';
    else if (healthScore >= 60) markdown += '🟠 Fair\n';
    else markdown += '🔴 Poor\n';
    
    markdown += '\n### Key Metrics\n\n';
    markdown += `| Metric | Value | Status |\n`;
    markdown += `|--------|-------|--------|\n`;
    markdown += `| Pages Working | ${report.summary.workingPages}/${report.summary.pagesScanned} | ${report.summary.brokenPages === 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| APIs Working | ${report.summary.apisWorking}/${report.summary.apisWorking + report.summary.apisBroken} | ${report.summary.apisBroken === 0 ? '✅' : '❌'} |\n`;
    markdown += `| Average Load Time | ${report.summary.averageLoadTime.toFixed(0)}ms | ${report.summary.averageLoadTime < 2000 ? '✅' : '⚠️'} |\n`;
    markdown += `| SEO Issues | ${report.summary.seoIssues} | ${report.summary.seoIssues === 0 ? '✅' : '⚠️'} |\n`;
    markdown += `| Forms Working | ${report.summary.formsWorking}/${report.summary.formsWorking + report.summary.formsBroken} | ${report.summary.formsBroken === 0 ? '✅' : '❌'} |\n`;
    
    // Critical Issues
    markdown += '\n## Critical Issues\n\n';
    if (report.details.pages.broken.length > 0) {
      markdown += '### Broken Pages\n';
      report.details.pages.broken.forEach(page => {
        markdown += `- **${page.type}**: ${page.url} - ${page.error}\n`;
      });
      markdown += '\n';
    }
    
    if (report.details.apis.broken.length > 0) {
      markdown += '### Broken APIs\n';
      report.details.apis.broken.forEach(api => {
        markdown += `- **${api.name}**: ${api.status || api.error}\n`;
      });
      markdown += '\n';
    }
    
    // Performance Issues
    if (report.details.performance.slowPages.length > 0) {
      markdown += '### Performance Issues\n';
      markdown += 'Pages loading slower than 3 seconds:\n';
      report.details.performance.slowPages.forEach(page => {
        markdown += `- ${page.url} - ${(page.loadTime/1000).toFixed(1)}s\n`;
      });
      markdown += '\n';
    }
    
    // SEO Issues
    if (report.summary.seoIssues > 0) {
      markdown += '### SEO Issues\n';
      if (report.details.seo.missingMeta.length > 0) {
        markdown += '#### Missing Meta Tags\n';
        report.details.seo.missingMeta.forEach(issue => {
          markdown += `- ${issue.url}: ${issue.issue}\n`;
        });
      }
      if (report.details.seo.missingH1.length > 0) {
        markdown += '#### Missing H1 Tags\n';
        report.details.seo.missingH1.forEach(url => {
          markdown += `- ${url}\n`;
        });
      }
      markdown += '\n';
    }
    
    // Recommendations
    markdown += '## Recommendations\n\n';
    markdown += this.generateRecommendations(report);
    
    const summaryPath = path.join(__dirname, '../logs/extended-audit-summary.md');
    await fs.writeFile(summaryPath, markdown);
    console.log(`📝 Summary report saved to: ${summaryPath}`);
  }

  calculateHealthScore(report) {
    let score = 100;
    
    // Deduct for broken pages
    score -= report.summary.brokenPages * 5;
    
    // Deduct for broken APIs
    score -= report.summary.apisBroken * 10;
    
    // Deduct for slow pages
    score -= report.summary.slowPages * 2;
    
    // Deduct for SEO issues
    score -= report.summary.seoIssues * 1;
    
    // Deduct for broken forms
    score -= report.summary.formsBroken * 5;
    
    return Math.max(0, score);
  }

  generateRecommendations(report) {
    let recommendations = '';
    
    if (report.summary.apisBroken > 0) {
      recommendations += '1. **CRITICAL**: Fix broken API endpoints immediately\n';
      recommendations += '   - Check database connections\n';
      recommendations += '   - Verify environment variables\n';
      recommendations += '   - Review API route handlers\n\n';
    }
    
    if (report.summary.brokenPages > 0) {
      recommendations += '2. **HIGH**: Fix broken pages\n';
      recommendations += '   - Review dynamic routing logic\n';
      recommendations += '   - Check for missing page components\n\n';
    }
    
    if (report.summary.slowPages > 0) {
      recommendations += '3. **MEDIUM**: Optimize slow-loading pages\n';
      recommendations += '   - Implement caching strategies\n';
      recommendations += '   - Optimize database queries\n';
      recommendations += '   - Consider lazy loading\n\n';
    }
    
    if (report.summary.seoIssues > 0) {
      recommendations += '4. **MEDIUM**: Address SEO issues\n';
      recommendations += '   - Add missing meta tags\n';
      recommendations += '   - Ensure proper H1 usage\n';
      recommendations += '   - Implement structured data\n\n';
    }
    
    return recommendations;
  }
}

// Run the extended audit
async function main() {
  const auditor = new ExtendedSiteAuditor('http://localhost:3000');
  await auditor.audit();
}

main().catch(console.error);