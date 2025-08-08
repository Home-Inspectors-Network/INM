#!/usr/bin/env node

/**
 * Automated Sitemap Generation Cron Job
 * 
 * This script is designed to run as a cron job to automatically:
 * 1. Generate fresh sitemaps
 * 2. Validate sitemap structure
 * 3. Submit to search engines
 * 4. Send alerts if issues are detected
 * 
 * Usage:
 * - Daily cron: 0 2 * * * /usr/bin/node /path/to/sitemap-cron.js
 * - Manual run: node scripts/sitemap-cron.js
 */

require('dotenv').config();
const { generateSitemaps } = require('./sitemap-builder');
const { validateAllSitemaps } = require('./sitemap-validator');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const LOG_DIR = path.join(__dirname, '..', 'logs');
const cronLogFile = path.join(LOG_DIR, 'sitemap-cron.log');

function cronLog(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(cronLogFile, logMessage + '\n');
}

// Check if sitemap regeneration is needed
async function shouldRegenerateSitemap() {
  try {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    
    if (!await fs.pathExists(sitemapPath)) {
      cronLog('Sitemap does not exist, regeneration needed');
      return true;
    }
    
    const stats = await fs.stat(sitemapPath);
    const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
    
    // Regenerate if sitemap is older than 24 hours
    if (ageInHours > 24) {
      cronLog(`Sitemap is ${Math.round(ageInHours)} hours old, regeneration needed`);
      return true;
    }
    
    cronLog(`Sitemap is ${Math.round(ageInHours)} hours old, still fresh`);
    return false;
    
  } catch (error) {
    cronLog(`Error checking sitemap age: ${error.message}`, 'ERROR');
    return true; // Regenerate if we can't check
  }
}

// Send notification (placeholder for email/webhook integration)
async function sendNotification(subject, message, level = 'INFO') {
  try {
    cronLog(`NOTIFICATION [${level}]: ${subject} - ${message}`);
    
    // TODO: Integrate with SendGrid or webhook for actual notifications
    // Example:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: process.env.ADMIN_EMAIL,
    //   from: process.env.FROM_EMAIL,
    //   subject: `[InspectorsNearMe] ${subject}`,
    //   text: message
    // };
    // 
    // await sgMail.send(msg);
    
  } catch (error) {
    cronLog(`Failed to send notification: ${error.message}`, 'ERROR');
  }
}

// Main cron job function
async function runSitemapCron() {
  try {
    await fs.ensureDir(LOG_DIR);
    cronLog('=== Starting Sitemap Cron Job ===');
    
    const startTime = Date.now();
    let errors = [];
    let warnings = [];
    
    // Check if regeneration is needed
    const shouldRegenerate = await shouldRegenerateSitemap();
    
    if (shouldRegenerate) {
      cronLog('Regenerating sitemaps...');
      
      try {
        const results = await generateSitemaps();
        cronLog(`Sitemap generation completed: ${results.mainSitemap.stats.total} URLs`);
        
        // Log statistics
        Object.entries(results.mainSitemap.stats.byType).forEach(([type, count]) => {
          cronLog(`  ${type}: ${count} URLs`);
        });
        
      } catch (error) {
        errors.push(`Sitemap generation failed: ${error.message}`);
        cronLog(`Sitemap generation failed: ${error.message}`, 'ERROR');
      }
    }
    
    // Always validate existing sitemaps
    cronLog('Validating sitemaps...');
    try {
      const validation = await validateAllSitemaps();
      
      if (validation.summary.invalidFiles > 0) {
        errors.push(`${validation.summary.invalidFiles} invalid sitemap files found`);
        validation.summary.issues.forEach(issue => {
          cronLog(`Validation issue: ${issue}`, 'WARNING');
        });
      } else {
        cronLog('All sitemaps are valid');
      }
      
      if (validation.summary.totalUrls === 0) {
        errors.push('No URLs found in sitemaps');
      } else {
        cronLog(`Total URLs validated: ${validation.summary.totalUrls}`);
      }
      
    } catch (error) {
      errors.push(`Sitemap validation failed: ${error.message}`);
      cronLog(`Sitemap validation failed: ${error.message}`, 'ERROR');
    }
    
    // Check robots.txt
    try {
      const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
      if (await fs.pathExists(robotsPath)) {
        const robotsContent = await fs.readFile(robotsPath, 'utf8');
        if (!robotsContent.includes('Sitemap:')) {
          warnings.push('robots.txt does not contain sitemap directive');
        }
      } else {
        warnings.push('robots.txt not found');
      }
    } catch (error) {
      warnings.push(`Error checking robots.txt: ${error.message}`);
    }
    
    // Calculate runtime
    const runtime = Math.round((Date.now() - startTime) / 1000);
    
    // Send notifications based on results
    if (errors.length > 0) {
      await sendNotification(
        'Sitemap Cron Job - Errors Detected',
        `Errors encountered during sitemap cron job:\n${errors.join('\n')}\n\nRuntime: ${runtime}s`,
        'ERROR'
      );
    } else if (warnings.length > 0) {
      await sendNotification(
        'Sitemap Cron Job - Warnings',
        `Warnings from sitemap cron job:\n${warnings.join('\n')}\n\nRuntime: ${runtime}s`,
        'WARNING'
      );
    }
    
    // Log completion
    cronLog(`=== Sitemap Cron Job Completed ===`);
    cronLog(`Runtime: ${runtime} seconds`);
    cronLog(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      cronLog('CRON STATUS: FAILED', 'ERROR');
      process.exit(1);
    } else {
      cronLog('CRON STATUS: SUCCESS');
    }
    
  } catch (error) {
    cronLog(`Fatal error in sitemap cron: ${error.message}`, 'ERROR');
    
    await sendNotification(
      'Sitemap Cron Job - Fatal Error',
      `Fatal error in sitemap cron job: ${error.message}`,
      'ERROR'
    );
    
    process.exit(1);
  }
}

// Health check function
async function healthCheck() {
  try {
    cronLog('=== Sitemap Health Check ===');
    
    const checks = {
      sitemapExists: false,
      sitemapAge: null,
      robotsExists: false,
      urlCount: 0,
      lastGeneration: null
    };
    
    // Check main sitemap
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    if (await fs.pathExists(sitemapPath)) {
      checks.sitemapExists = true;
      const stats = await fs.stat(sitemapPath);
      checks.sitemapAge = Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60));
      checks.lastGeneration = stats.mtime.toISOString();
      
      // Count URLs
      const content = await fs.readFile(sitemapPath, 'utf8');
      const urlMatches = content.match(/<url>/g);
      checks.urlCount = urlMatches ? urlMatches.length : 0;
    }
    
    // Check robots.txt
    const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
    checks.robotsExists = await fs.pathExists(robotsPath);
    
    // Log health status
    cronLog(`Sitemap exists: ${checks.sitemapExists}`);
    cronLog(`Sitemap age: ${checks.sitemapAge} hours`);
    cronLog(`URL count: ${checks.urlCount}`);
    cronLog(`robots.txt exists: ${checks.robotsExists}`);
    cronLog(`Last generation: ${checks.lastGeneration}`);
    
    return checks;
    
  } catch (error) {
    cronLog(`Health check failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'health':
    healthCheck().catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
    break;
    
  case 'force':
    cronLog('Force regeneration requested');
    generateSitemaps()
      .then(() => validateAllSitemaps())
      .then(() => {
        cronLog('Force regeneration completed');
      })
      .catch(error => {
        cronLog(`Force regeneration failed: ${error.message}`, 'ERROR');
        process.exit(1);
      });
    break;
    
  default:
    // Run normal cron job
    runSitemapCron().catch(error => {
      console.error('Sitemap cron failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runSitemapCron,
  healthCheck,
  shouldRegenerateSitemap,
  sendNotification
};