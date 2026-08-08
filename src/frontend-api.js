/**
 * DS-160 Frontend API
 * 
 * This module provides functions that can be used by the frontend
 * to interact with the DS-160 form automation.
 */

import { DS160_SELECTORS, VALIDATION_PATTERNS } from './selectors.js';

/**
 * Get all selectors for frontend use
 * @returns {Object} All DS-160 form selectors
 */
export function getSelectors() {
  return DS160_SELECTORS;
}

/**
 * Get CAPTCHA-related selectors and helper functions
 * @returns {Object} CAPTCHA selectors and utilities
 */
export function getCaptchaConfig() {
  return {
    selectors: DS160_SELECTORS.captcha,
    
    // Helper to extract CAPTCHA image source
    getImageSrc: () => {
      const img = document.querySelector(DS160_SELECTORS.captcha.image);
      return img ? img.src : null;
    },
    
    // Helper to check if CAPTCHA is visible
    isVisible: () => {
      const input = document.querySelector(DS160_SELECTORS.captcha.input);
      return input && input.offsetParent !== null;
    },
  };
}

/**
 * Get error/validation-related selectors and helper functions
 * @returns {Object} Error selectors and utilities
 */
export function getErrorConfig() {
  return {
    selectors: DS160_SELECTORS.errors,
    
    // Check if the page has validation errors
    hasErrors: VALIDATION_PATTERNS.hasErrors,
    
    // Get all error messages from the page
    getErrorMessages: VALIDATION_PATTERNS.getErrorMessages,
    
    // Additional helper to get errors as structured data
    getStructuredErrors: () => {
      const errors = [];
      
      // Main validation summary
      const summaryElement = document.querySelector(
        DS160_SELECTORS.errors.validationSummary
      );
      if (summaryElement) {
        const summaryText = summaryElement.textContent.trim();
        if (summaryText) {
          errors.push({
            type: 'summary',
            message: summaryText,
            element: 'validationSummary',
          });
        }
      }
      
      // Field-level errors
      const fieldErrors = document.querySelectorAll(
        DS160_SELECTORS.errors.fieldError
      );
      fieldErrors.forEach((error, index) => {
        const message = error.textContent.trim();
        if (message) {
          // Try to find the associated field
          const fieldId = error.getAttribute('data-valmsg-for') || 
                         error.closest('.form-group')?.querySelector('input, select, textarea')?.id ||
                         `unknown-field-${index}`;
          
          errors.push({
            type: 'field',
            message: message,
            fieldId: fieldId,
            element: error,
          });
        }
      });
      
      return errors;
    },
  };
}

/**
 * Get all form field selectors for a specific page
 * @param {string} pageName - Name of the page ('personalInfo1', 'personalInfo2', etc.)
 * @returns {Object} Field selectors for the specified page
 */
export function getFormFieldSelectors(pageName) {
  const mapping = {
    personalInfo1: [
      'surname',
      'givenName',
      'fullName',
      'gender',
      'maritalStatus',
      'dateOfBirth',
      'cityOfBirth',
      'stateOfBirth',
      'countryOfBirth',
    ],
    personalInfo2: [
      'nationality',
      'hasOtherNationality',
      'isPermanentResident',
      'nationalId',
      'nationalIdNA',
      'ssnParts',
      'ssnNA',
      'taxId',
      'taxIdNA',
    ],
  };
  
  const fields = mapping[pageName] || [];
  const result = {};
  
  fields.forEach(fieldName => {
    result[fieldName] = DS160_SELECTORS.personalInfo[fieldName];
  });
  
  return result;
}

/**
 * Create a message payload for sending to frontend
 * @param {string} type - Message type ('captcha', 'error', 'progress', etc.)
 * @param {Object} data - Message data
 * @returns {Object} Formatted message payload
 */
export function createMessage(type, data) {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Export configuration for frontend integration
 * This can be sent as JSON to the frontend
 */
export const FRONTEND_CONFIG = {
  selectors: DS160_SELECTORS,
  
  // CAPTCHA configuration
  captcha: {
    imageSelector: DS160_SELECTORS.captcha.image,
    inputSelector: DS160_SELECTORS.captcha.input,
    containerSelector: DS160_SELECTORS.captcha.container,
  },
  
  // Error configuration
  errors: {
    validationSummarySelector: DS160_SELECTORS.errors.validationSummary,
    fieldErrorSelector: DS160_SELECTORS.errors.fieldError,
    errorSpanSelector: DS160_SELECTORS.errors.errorSpan,
  },
  
  // API endpoints (to be configured based on your backend)
  apiEndpoints: {
    submitCaptcha: '/api/captcha/submit',
    getFormData: '/api/form/data',
    saveProgress: '/api/form/save',
    getErrors: '/api/form/errors',
  },
};

export default {
  getSelectors,
  getCaptchaConfig,
  getErrorConfig,
  getFormFieldSelectors,
  createMessage,
  FRONTEND_CONFIG,
};
