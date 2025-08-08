require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Configuration
const SITEMAP_DIR = path.join(__dirname, '..', 'public');
const LOG_DIR = path.join(__dirname, '..', 'logs');
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inspectorsnearme.com';

// Logging
const logFile = path.join(LOG_DIR, 'sitemap-validation.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Validate XML structure
async function validateXmlStructure(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const checks = {
      hasXmlDeclaration: content.includes('<?xml version="1.0"'),
      hasProperEncoding: content.includes('encoding="UTF-8"'),
      hasNamespace: content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
      hasUrlsetOrSitemapindex: content.includes('<urlset') || content.includes('<sitemapindex'),
      hasClosingTags: content.includes('</urlset>') || content.includes('</sitemapindex>'),
      urlCount: (content.match(/<url>/g) || []).length,
      sitemapCount: (content.match(/<sitemap>/g) || []).length,
      fileSize: content.length,
      isWellFormed: true // We'll set this based on other checks
    };
    
    // Check for common XML issues
    const commonIssues = [];
    
    if (!checks.hasXmlDeclaration) {
      commonIssues.push('Missing XML declaration');
    }
    
    if (!checks.hasProperEncoding) {
      commonIssues.push('Missing UTF-8 encoding declaration');
    }
    
    if (!checks.hasNamespace) {
      commonIssues.push('Missing sitemap namespace');
    }
    
    if (checks.urlCount === 0 && checks.sitemapCount === 0) {
      commonIssues.push('No URLs or sitemaps found');
    }
    
    if (checks.urlCount > 50000) {
      commonIssues.push(`Too many URLs (${checks.urlCount}). Maximum is 50,000 per sitemap.`);
    }
    
    if (checks.fileSize > 50 * 1024 * 1024) {
      commonIssues.push(`File too large (${Math.round(checks.fileSize / 1024 / 1024)}MB). Maximum is 50MB.`);
    }
    
    // Check for unescaped characters
    const unescapedChars = content.match(/[<>&"']/g);
    if (unescapedChars) {
      const suspiciousCount = content.split(/[<>&"']/).length - 1;
      if (suspiciousCount > checks.urlCount * 10) { // Rough heuristic
        commonIssues.push('Possible unescaped XML characters detected');
      }
    }
    
    checks.isWellFormed = commonIssues.length === 0;
    checks.issues = commonIssues;
    
    return checks;
    
  } catch (error) {
    log(`Error validating XML structure: ${error.message}`);
    return { isWellFormed: false, error: error.message };
  }
}

// Validate URL accessibility
async function validateUrlAccessibility(urls, sampleSize = 10) {
  try {
    log(`Validating URL accessibility (sample of ${Math.min(sampleSize, urls.length)} URLs)...`);
    
    const sampleUrls = urls.slice(0, sampleSize);
    const results = [];
    
    for (const url of sampleUrls) {
      try {
        const response = await axios.head(url, { 
          timeout: 5000,
          maxRedirects: 3,
          validateStatus: status => status < 500 // Accept redirects but not server errors
        });
        
        results.push({
          url,
          status: response.status,
          accessible: response.status < 400,
          redirected: response.status >= 300 && response.status < 400
        });
        
      } catch (error) {
        results.push({
          url,
          status: error.response?.status || 0,
          accessible: false,
          error: error.message
        });
      }
    }
    
    const accessible = results.filter(r => r.accessible).length;
    const inaccessible = results.filter(r => !r.accessible).length;
    const redirected = results.filter(r => r.redirected).length;
    
    log(`URL accessibility check: ${accessible}/${results.length} accessible, ${redirected} redirected, ${inaccessible} inaccessible`);
    
    return {
      total: results.length,
      accessible,
      inaccessible,
      redirected,
      results
    };
    
  } catch (error) {
    log(`Error in URL accessibility check: ${error.message}`);
    return { error: error.message };
  }
}

// Extract URLs from sitemap
function extractUrlsFromSitemap(content) {
  const urls = [];
  const urlMatches = content.match(/<loc>(.*?)<\/loc>/g);
  
  if (urlMatches) {
    urlMatches.forEach(match => {
      const url = match.replace(/<\/?loc>/g, '');
      urls.push(url);
    });
  }
  
  return urls;
}

// Validate sitemap content
async function validateSitemapContent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const urls = extractUrlsFromSitemap(content);
    
    const validationResults = {
      totalUrls: urls.length,
      uniqueUrls: [...new Set(urls)].length,
      duplicates: urls.length - [...new Set(urls)].length,
      urlIssues: [],
      priorities: [],
      changeFreqs: [],
      lastMods: []
    };
    
    // Check each URL
    urls.forEach(url => {
      // Check URL format
      try {
        new URL(url);
      } catch {
        validationResults.urlIssues.push(`Invalid URL format: ${url}`);
      }
      
      // Check if URL belongs to the site
      if (!url.startsWith(SITE_URL)) {
        validationResults.urlIssues.push(`External URL found: ${url}`);
      }
    });
    
    // Extract priorities
    const priorityMatches = content.match(/<priority>(.*?)<\/priority>/g);
    if (priorityMatches) {
      priorityMatches.forEach(match => {
        const priority = parseFloat(match.replace(/<\/?priority>/g, ''));
        validationResults.priorities.push(priority);
        
        if (priority < 0 || priority > 1) {
          validationResults.urlIssues.push(`Invalid priority value: ${priority}`);
        }
      });
    }
    
    // Extract change frequencies
    const changefreqMatches = content.match(/<changefreq>(.*?)<\/changefreq>/g);
    if (changefreqMatches) {
      const validChangeFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
      changefreqMatches.forEach(match => {
        const changefreq = match.replace(/<\/?changefreq>/g, '');
        validationResults.changeFreqs.push(changefreq);
        
        if (!validChangeFreqs.includes(changefreq)) {
          validationResults.urlIssues.push(`Invalid changefreq value: ${changefreq}`);
        }
      });
    }
    
    // Extract last modification dates
    const lastmodMatches = content.match(/<lastmod>(.*?)<\/lastmod>/g);
    if (lastmodMatches) {
      lastmodMatches.forEach(match => {
        const lastmod = match.replace(/<\/?lastmod>/g, '');
        validationResults.lastMods.push(lastmod);
        
        // Check date format (ISO 8601)
        if (!lastmod.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)) {
          validationResults.urlIssues.push(`Invalid lastmod date format: ${lastmod}`);
        }
      });
    }
    
    return { urls, validation: validationResults };
    
  } catch (error) {
    log(`Error validating sitemap content: ${error.message}`);
    return { error: error.message };
  }
}

// Validate specific sitemap file
async function validateSitemapFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    log(`Validating ${fileName}...`);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return {
        file: fileName,
        exists: false,
        error: 'File does not exist'
      };
    }
    
    const results = {
      file: fileName,
      path: filePath,
      exists: true,
      size: (await fs.stat(filePath)).size,
      lastModified: (await fs.stat(filePath)).mtime
    };
    
    // Validate XML structure
    results.xmlValidation = await validateXmlStructure(filePath);
    
    // Validate content if XML is well-formed
    if (results.xmlValidation.isWellFormed) {
      const contentValidation = await validateSitemapContent(filePath);
      results.contentValidation = contentValidation.validation;
      
      // Sample URL accessibility check
      if (contentValidation.urls && contentValidation.urls.length > 0) {
        results.accessibilityCheck = await validateUrlAccessibility(contentValidation.urls, 5);
      }
    }
    
    // Overall validation status
    results.isValid = results.xmlValidation.isWellFormed && 
                     (!results.contentValidation || results.contentValidation.urlIssues.length === 0);
    
    log(`${fileName}: ${results.isValid ? 'VALID' : 'INVALID'}`);
    
    return results;
    
  } catch (error) {
    log(`Error validating ${path.basename(filePath)}: ${error.message}`);
    return {
      file: path.basename(filePath),
      error: error.message,
      isValid: false
    };
  }
}

// Main validation function
async function validateAllSitemaps() {
  try {
    await fs.ensureDir(LOG_DIR);
    log('Starting sitemap validation...');
    
    const results = {
      timestamp: new Date().toISOString(),
      siteUrl: SITE_URL,
      validatedFiles: [],
      summary: {
        totalFiles: 0,
        validFiles: 0,
        invalidFiles: 0,
        totalUrls: 0,
        issues: []
      }
    };
    
    // Files to validate
    const filesToValidate = [
      path.join(SITEMAP_DIR, 'sitemap.xml'),
      path.join(SITEMAP_DIR, 'sitemap-index.xml'),
      path.join(SITEMAP_DIR, 'sitemap-images.xml'),
      path.join(SITEMAP_DIR, 'sitemaps', 'city-pages.xml'),
      path.join(SITEMAP_DIR, 'sitemaps', 'inspectors.xml'),
      path.join(SITEMAP_DIR, 'robots.txt')
    ];
    
    for (const filePath of filesToValidate) {
      if (await fs.pathExists(filePath)) {
        const fileResult = await validateSitemapFile(filePath);
        results.validatedFiles.push(fileResult);
        results.summary.totalFiles++;
        
        if (fileResult.isValid) {
          results.summary.validFiles++;
        } else {
          results.summary.invalidFiles++;
          
          // Collect issues
          if (fileResult.xmlValidation?.issues) {
            results.summary.issues.push(...fileResult.xmlValidation.issues.map(issue => 
              `${path.basename(filePath)}: ${issue}`
            ));
          }
          
          if (fileResult.contentValidation?.urlIssues) {
            results.summary.issues.push(...fileResult.contentValidation.urlIssues.map(issue => 
              `${path.basename(filePath)}: ${issue}`
            ));
          }
        }
        
        // Count URLs
        if (fileResult.xmlValidation?.urlCount) {
          results.summary.totalUrls += fileResult.xmlValidation.urlCount;
        }
      }
    }
    
    // Validate robots.txt separately
    const robotsPath = path.join(SITEMAP_DIR, 'robots.txt');
    if (await fs.pathExists(robotsPath)) {
      const robotsContent = await fs.readFile(robotsPath, 'utf8');
      const robotsValidation = {
        file: 'robots.txt',
        exists: true,
        hasSitemapDirective: robotsContent.includes('Sitemap:'),
        sitemapUrls: (robotsContent.match(/Sitemap: (.+)/g) || []).map(line => 
          line.replace('Sitemap: ', '')
        ),
        isValid: robotsContent.includes('User-agent:') && robotsContent.includes('Sitemap:')
      };
      
      results.validatedFiles.push(robotsValidation);
    }
    
    // Save validation report
    const reportPath = path.join(LOG_DIR, 'sitemap-validation-report.json');
    await fs.writeJson(reportPath, results, { spaces: 2 });
    
    // Log summary
    log('\n=== Sitemap Validation Summary ===');
    log(`Total files validated: ${results.summary.totalFiles}`);
    log(`Valid files: ${results.summary.validFiles}`);
    log(`Invalid files: ${results.summary.invalidFiles}`);
    log(`Total URLs found: ${results.summary.totalUrls}`);
    log(`Issues found: ${results.summary.issues.length}`);
    
    if (results.summary.issues.length > 0) {
      log('\nIssues:');
      results.summary.issues.forEach(issue => {
        log(`  - ${issue}`);
      });
    }
    
    log(`Validation report saved: ${reportPath}`);
    
    const overallValid = results.summary.invalidFiles === 0;
    log(`\nOverall validation status: ${overallValid ? 'PASSED' : 'FAILED'}`);
    
    return results;
    
  } catch (error) {
    log(`Error in sitemap validation: ${error.message}`);
    throw error;
  }
}

// Test sitemap submission URL
async function testSubmissionUrl() {
  try {
    log('Testing sitemap submission URLs...');
    
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    const googleSubmitUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const bingSubmitUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    log(`Google submission URL: ${googleSubmitUrl}`);
    log(`Bing submission URL: ${bingSubmitUrl}`);
    
    // Test if sitemap is accessible
    try {
      const response = await axios.head(sitemapUrl, { timeout: 5000 });
      log(`Sitemap accessibility: ${response.status === 200 ? 'ACCESSIBLE' : 'INACCESSIBLE'}`);
    } catch (error) {
      log(`Sitemap accessibility: INACCESSIBLE (${error.message})`);
    }
    
  } catch (error) {
    log(`Error testing submission URLs: ${error.message}`);
  }
}

module.exports = {
  validateAllSitemaps,
  validateSitemapFile,
  validateXmlStructure,
  validateUrlAccessibility,
  testSubmissionUrl
};

// Run if called directly
if (require.main === module) {
  validateAllSitemaps()
    .then(() => testSubmissionUrl())
    .catch(error => {
      console.error('Sitemap validation failed:', error);
      process.exit(1);
    });
}