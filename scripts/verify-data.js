require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Logging
const logFile = path.join(__dirname, '..', 'logs', 'verification.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Verify phone number format and validity
function verifyPhone(phone) {
  if (!phone) return { valid: false, reason: 'Missing phone number' };
  
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (cleaned.length < 10) {
    return { valid: false, reason: 'Phone number too short' };
  }
  
  if (cleaned.length > 11) {
    return { valid: false, reason: 'Phone number too long' };
  }
  
  // Check for obviously invalid patterns
  const invalidPatterns = [
    /^0+$/, // All zeros
    /^1+$/, // All ones
    /^(\d)\1{9,}$/, // Repeated digits
    /^1234567890$/, // Sequential
    /^0987654321$/, // Reverse sequential
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) {
      return { valid: false, reason: 'Invalid phone pattern' };
    }
  }
  
  return { valid: true, formatted: phone };
}

// Verify email format
function verifyEmail(email) {
  if (!email) return { valid: false, reason: 'Missing email' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  // Check for common typos in domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1];
  
  return { valid: true, domain };
}

// Verify website accessibility
async function verifyWebsite(website) {
  if (!website) return { valid: false, reason: 'Missing website' };
  
  try {
    const response = await axios.head(website, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InspectorsNearMe/1.0; +https://inspectorsnearme.com)'
      }
    });
    
    return { 
      valid: true, 
      statusCode: response.status,
      accessible: response.status >= 200 && response.status < 400
    };
  } catch (error) {
    return { 
      valid: false, 
      reason: error.message,
      statusCode: error.response?.status || null
    };
  }
}

// Verify business name quality
function verifyBusinessName(businessName) {
  if (!businessName) return { valid: false, reason: 'Missing business name' };
  
  const name = businessName.trim();
  
  if (name.length < 3) {
    return { valid: false, reason: 'Business name too short' };
  }
  
  if (name.length > 100) {
    return { valid: false, reason: 'Business name too long' };
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /\b(cheap|free|best|#1|guaranteed)\b/i,
    /\b(click here|call now|limited time)\b/i,
    /[!]{2,}/, // Multiple exclamation marks
    /\$\$\$/, // Dollar signs
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(name)) {
      return { valid: false, reason: 'Potential spam in business name' };
    }
  }
  
  return { valid: true, cleaned: name };
}

// Verify address completeness
function verifyAddress(inspector) {
  const required = ['address_street', 'address_city', 'address_state'];
  const missing = [];
  
  for (const field of required) {
    if (!inspector[field] || inspector[field].trim() === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return { valid: false, reason: `Missing address fields: ${missing.join(', ')}` };
  }
  
  // Validate state code
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  if (!validStates.includes(inspector.address_state?.toUpperCase())) {
    return { valid: false, reason: 'Invalid state code' };
  }
  
  // Validate ZIP code if present
  if (inspector.address_zip) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(inspector.address_zip)) {
      return { valid: false, reason: 'Invalid ZIP code format' };
    }
  }
  
  return { valid: true };
}

// Check for duplicate inspectors
async function findDuplicates() {
  try {
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*');
    
    if (error) throw error;
    
    const phoneMap = new Map();
    const emailMap = new Map();
    const nameMap = new Map();
    const duplicates = [];
    
    for (const inspector of inspectors) {
      // Check phone duplicates
      if (inspector.phone) {
        const cleanPhone = inspector.phone.replace(/[^\d]/g, '');
        if (phoneMap.has(cleanPhone)) {
          duplicates.push({
            type: 'phone',
            inspector1: phoneMap.get(cleanPhone),
            inspector2: inspector,
            value: cleanPhone
          });
        } else {
          phoneMap.set(cleanPhone, inspector);
        }
      }
      
      // Check email duplicates
      if (inspector.email) {
        const cleanEmail = inspector.email.toLowerCase();
        if (emailMap.has(cleanEmail)) {
          duplicates.push({
            type: 'email',
            inspector1: emailMap.get(cleanEmail),
            inspector2: inspector,
            value: cleanEmail
          });
        } else {
          emailMap.set(cleanEmail, inspector);
        }
      }
      
      // Check name + location duplicates
      const nameKey = `${inspector.business_name?.toLowerCase()}_${inspector.address_city?.toLowerCase()}_${inspector.address_state}`;
      if (nameMap.has(nameKey)) {
        duplicates.push({
          type: 'name_location',
          inspector1: nameMap.get(nameKey),
          inspector2: inspector,
          value: nameKey
        });
      } else {
        nameMap.set(nameKey, inspector);
      }
    }
    
    return duplicates;
    
  } catch (error) {
    log(`Error finding duplicates: ${error.message}`);
    return [];
  }
}

// Generate data quality report
async function generateQualityReport() {
  try {
    log('Generating data quality report...');
    
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*');
    
    if (error) throw error;
    
    const report = {
      totalInspectors: inspectors.length,
      timestamp: new Date().toISOString(),
      fieldCompleteness: {},
      validationResults: {
        validPhones: 0,
        invalidPhones: 0,
        validEmails: 0,
        invalidEmails: 0,
        validWebsites: 0,
        invalidWebsites: 0,
        validBusinessNames: 0,
        invalidBusinessNames: 0,
        completeAddresses: 0,
        incompleteAddresses: 0
      },
      issues: [],
      duplicates: await findDuplicates()
    };
    
    // Calculate field completeness
    const fields = [
      'business_name', 'owner_name', 'email', 'phone', 'website',
      'address_street', 'address_city', 'address_state', 'address_zip',
      'lat', 'lng', 'certifications', 'services'
    ];
    
    for (const field of fields) {
      const completed = inspectors.filter(i => i[field] && i[field] !== '').length;
      report.fieldCompleteness[field] = {
        completed,
        percentage: ((completed / inspectors.length) * 100).toFixed(2)
      };
    }
    
    // Validate each inspector
    for (const inspector of inspectors) {
      // Verify phone
      const phoneCheck = verifyPhone(inspector.phone);
      if (phoneCheck.valid) {
        report.validationResults.validPhones++;
      } else {
        report.validationResults.invalidPhones++;
        report.issues.push({
          inspectorId: inspector.id,
          field: 'phone',
          issue: phoneCheck.reason,
          value: inspector.phone
        });
      }
      
      // Verify email
      const emailCheck = verifyEmail(inspector.email);
      if (emailCheck.valid) {
        report.validationResults.validEmails++;
      } else {
        report.validationResults.invalidEmails++;
        if (inspector.email) { // Only report as issue if email is present but invalid
          report.issues.push({
            inspectorId: inspector.id,
            field: 'email',
            issue: emailCheck.reason,
            value: inspector.email
          });
        }
      }
      
      // Verify business name
      const nameCheck = verifyBusinessName(inspector.business_name);
      if (nameCheck.valid) {
        report.validationResults.validBusinessNames++;
      } else {
        report.validationResults.invalidBusinessNames++;
        report.issues.push({
          inspectorId: inspector.id,
          field: 'business_name',
          issue: nameCheck.reason,
          value: inspector.business_name
        });
      }
      
      // Verify address
      const addressCheck = verifyAddress(inspector);
      if (addressCheck.valid) {
        report.validationResults.completeAddresses++;
      } else {
        report.validationResults.incompleteAddresses++;
        report.issues.push({
          inspectorId: inspector.id,
          field: 'address',
          issue: addressCheck.reason,
          value: `${inspector.address_street}, ${inspector.address_city}, ${inspector.address_state}`
        });
      }
    }
    
    // Calculate quality score
    const totalChecks = report.validationResults.validPhones + 
                       report.validationResults.invalidPhones +
                       report.validationResults.validEmails + 
                       report.validationResults.invalidEmails +
                       report.validationResults.validBusinessNames + 
                       report.validationResults.invalidBusinessNames +
                       report.validationResults.completeAddresses + 
                       report.validationResults.incompleteAddresses;
    
    const validChecks = report.validationResults.validPhones +
                       report.validationResults.validEmails +
                       report.validationResults.validBusinessNames +
                       report.validationResults.completeAddresses;
    
    report.qualityScore = totalChecks > 0 ? ((validChecks / totalChecks) * 100).toFixed(2) : 0;
    report.duplicateRate = inspectors.length > 0 ? ((report.duplicates.length / inspectors.length) * 100).toFixed(2) : 0;
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'logs', 'quality-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    log(`Quality report generated: ${reportPath}`);
    log(`Quality score: ${report.qualityScore}%`);
    log(`Duplicate rate: ${report.duplicateRate}%`);
    log(`Total issues found: ${report.issues.length}`);
    
    return report;
    
  } catch (error) {
    log(`Error generating quality report: ${error.message}`);
    throw error;
  }
}

// Clean up invalid records
async function cleanupInvalidRecords() {
  try {
    log('Starting cleanup of invalid records...');
    
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('*');
    
    if (error) throw error;
    
    const toDelete = [];
    
    for (const inspector of inspectors) {
      const nameCheck = verifyBusinessName(inspector.business_name);
      const addressCheck = verifyAddress(inspector);
      
      // Mark for deletion if critical fields are invalid
      if (!nameCheck.valid || !addressCheck.valid) {
        // Only delete if it's clearly spam or completely invalid
        if (nameCheck.reason?.includes('spam') || 
            addressCheck.reason?.includes('Missing') ||
            inspector.business_name?.length < 3) {
          toDelete.push(inspector.id);
        }
      }
    }
    
    if (toDelete.length > 0) {
      log(`Deleting ${toDelete.length} invalid records`);
      
      const { error: deleteError } = await supabase
        .from('inspectors')
        .delete()
        .in('id', toDelete);
      
      if (deleteError) throw deleteError;
      
      log(`Successfully deleted ${toDelete.length} invalid records`);
    } else {
      log('No invalid records found for cleanup');
    }
    
    return toDelete.length;
    
  } catch (error) {
    log(`Error during cleanup: ${error.message}`);
    throw error;
  }
}

// Main verification function
async function verifyData() {
  try {
    await fs.ensureDir(path.dirname(logFile));
    log('Starting data verification process...');
    
    // Generate quality report
    const report = await generateQualityReport();
    
    // Clean up invalid records if quality is poor
    if (parseFloat(report.qualityScore) < 80) {
      log('Quality score below 80%, running cleanup...');
      await cleanupInvalidRecords();
      
      // Regenerate report after cleanup
      await generateQualityReport();
    }
    
    log('Data verification complete');
    return report;
    
  } catch (error) {
    log(`Fatal error in verification: ${error.message}`);
    throw error;
  }
}

module.exports = {
  verifyData,
  generateQualityReport,
  cleanupInvalidRecords,
  verifyPhone,
  verifyEmail,
  verifyWebsite,
  verifyBusinessName,
  verifyAddress
};

// Run if called directly
if (require.main === module) {
  verifyData().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}