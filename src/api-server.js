/**
 * DS-160 REST API Example
 * 
 * Simple Express.js server that exposes selectors and utilities for frontend consumption
 * Install: npm install express cors
 */

import express from 'express';
import cors from 'cors';
import { FRONTEND_CONFIG, getCaptchaConfig, getErrorConfig, createMessage } from './frontend-api.js';
import { DS160_SELECTORS } from './selectors.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * GET /api/config
 * Returns complete configuration for frontend
 */
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: FRONTEND_CONFIG
  });
});

/**
 * GET /api/selectors
 * Returns all available selectors
 */
app.get('/api/selectors', (req, res) => {
  res.json({
    success: true,
    data: DS160_SELECTORS
  });
});

/**
 * GET /api/selectors/captcha
 * Returns CAPTCHA-specific selectors
 */
app.get('/api/selectors/captcha', (req, res) => {
  const config = getCaptchaConfig();
  res.json({
    success: true,
    data: {
      selectors: config.selectors,
      documentation: {
        input: 'CAPTCHA input field where user enters the code',
        image: 'CAPTCHA image element to display to user',
        container: 'Container div for the entire CAPTCHA section'
      }
    }
  });
});

/**
 * GET /api/selectors/errors
 * Returns error/validation selectors
 */
app.get('/api/selectors/errors', (req, res) => {
  const config = getErrorConfig();
  res.json({
    success: true,
    data: {
      selectors: config.selectors,
      documentation: {
        validationSummary: 'Main validation summary showing list of errors',
        fieldError: 'Individual field validation messages',
        errorSpan: 'Error text span elements'
      }
    }
  });
});

/**
 * GET /api/selectors/navigation
 * Returns navigation/button selectors
 */
app.get('/api/selectors/navigation', (req, res) => {
  res.json({
    success: true,
    data: {
      selectors: DS160_SELECTORS.navigation,
      documentation: {
        startApplication: 'Start new application button',
        nextButton: 'Continue/Next button',
        saveButton: 'Save and continue button',
        reviewButton: 'Review page button',
        completeButton: 'Complete page button'
      }
    }
  });
});

/**
 * GET /api/selectors/form/:page
 * Returns selectors for a specific form page
 * Pages: personalInfo1, personalInfo2
 */
app.get('/api/selectors/form/:page', (req, res) => {
  const { page } = req.params;
  
  const validPages = ['personalInfo1', 'personalInfo2'];
  if (!validPages.includes(page)) {
    return res.status(400).json({
      success: false,
      error: `Invalid page. Valid pages: ${validPages.join(', ')}`
    });
  }
  
  const fields = page === 'personalInfo1' 
    ? [
        'surname', 'givenName', 'fullName', 'gender', 'maritalStatus',
        'dateOfBirth', 'cityOfBirth', 'stateOfBirth', 'countryOfBirth'
      ]
    : [
        'nationality', 'hasOtherNationality', 'isPermanentResident',
        'nationalId', 'nationalIdNA', 'ssnParts', 'ssnNA', 'taxId', 'taxIdNA'
      ];
  
  const selectors = {};
  fields.forEach(field => {
    selectors[field] = DS160_SELECTORS.personalInfo[field];
  });
  
  res.json({
    success: true,
    page,
    data: selectors
  });
});

/**
 * POST /api/evaluate
 * Evaluate JavaScript in the page context (for use with Puppeteer)
 * Body: { script: "JavaScript code to evaluate" }
 */
app.post('/api/evaluate', async (req, res) => {
  const { script } = req.body;
  
  if (!script) {
    return res.status(400).json({
      success: false,
      error: 'Script is required'
    });
  }
  
  // This would be connected to your Puppeteer instance
  // For example: const result = await page.evaluate(script);
  
  res.json({
    success: true,
    message: 'Script execution endpoint (connect to Puppeteer)',
    script
  });
});

/**
 * GET /api/helper/build-selector/:partialId
 * Build a selector from partial ID
 */
app.get('/api/helper/build-selector/:partialId', (req, res) => {
  const { partialId } = req.params;
  const selector = `[id*="${partialId}"]`;
  
  res.json({
    success: true,
    partialId,
    selector,
    usage: `document.querySelector('${selector}')`
  });
});

/**
 * GET /api/documentation
 * Returns links to documentation
 */
app.get('/api/documentation', (req, res) => {
  res.json({
    success: true,
    documentation: {
      integration_guide: '/FRONTEND_INTEGRATION.md',
      available_endpoints: [
        'GET /api/config - Complete configuration',
        'GET /api/selectors - All selectors',
        'GET /api/selectors/captcha - CAPTCHA selectors',
        'GET /api/selectors/errors - Error selectors',
        'GET /api/selectors/navigation - Navigation selectors',
        'GET /api/selectors/form/:page - Form page selectors',
        'GET /api/helper/build-selector/:partialId - Build selector',
        'GET /api/documentation - This documentation'
      ]
    },
    examples: {
      get_captcha_config: 'GET /api/selectors/captcha',
      get_form_fields: 'GET /api/selectors/form/personalInfo1',
      build_custom_selector: 'GET /api/helper/build-selector/ddlNationality'
    }
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`DS-160 API Server running on http://localhost:${PORT}`);
  console.log(`Documentation: http://localhost:${PORT}/api/documentation`);
});

export default app;
