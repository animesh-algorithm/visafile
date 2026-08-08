/**
 * DS-160 Form Selectors
 * 
 * This file contains all CSS selectors used for interacting with the DS-160 form.
 * These can be exported to the frontend for production use.
 */

export const DS160_SELECTORS = {
  // ===== CAPTCHA SELECTORS =====
  captcha: {
    // CAPTCHA input field where user enters the code
    input: "#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox",
    
    // CAPTCHA image (for display to users)
    image: "#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_imgCaptcha",
    
    // Container for the entire CAPTCHA section
    container: "#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1",
  },

  // ===== ERROR & VALIDATION SELECTORS =====
  errors: {
    // Main validation summary (shows list of errors at top of page)
    validationSummary: "#ctl00_SiteContentPlaceHolder_ValidationSummary1",
    
    // Alternative validation summary locations
    validationSummaryAlt: ".validation-summary-errors",
    
    // Individual field validation messages
    fieldError: ".field-validation-error",
    
    // Error text spans
    errorSpan: "span.errormessage",
    
    // Required field indicators
    requiredField: "span.required",
    
    // General error messages container
    errorMessages: "[id*='ValidationSummary']",
  },

  // ===== FORM NAVIGATION SELECTORS =====
  navigation: {
    // Start new application button
    startApplication: "#ctl00_SiteContentPlaceHolder_lnkNew",
    
    // Continue/Next button
    nextButton: "#ctl00_SiteContentPlaceHolder_UpdateButton1",
    
    // Save and continue buttons
    saveButton: "#ctl00_SiteContentPlaceHolder_UpdateButton2",
    
    // Review page button
    reviewButton: "#ctl00_ucNavigateOption_ucNavPanel_ctl01_btnReviewPage",
    
    // Complete page button
    completeButton: "#ctl00_ucNavigateOption_ucNavPanel_ctl01_btnNextPageComplete",
  },

  // ===== LOCATION SELECTION =====
  location: {
    // Location dropdown selector
    dropdown: "#ctl00_SiteContentPlaceHolder_ucLocation_ddlLocation",
  },

  // ===== DIALOG/MODAL SELECTORS =====
  dialogs: {
    // Modal holder buttons
    modalHolder: "#ctl00_SiteContentPlaceHolder_btnModalHolder",
    
    // Warning dialog OK button
    warningOk: "#ctl00_SiteContentPlaceHolder_btnOkWarning",
    
    // Exit confirmation
    exitWarning: "#ctl00_btnCancelExitWarning",
  },

  // ===== PERSONAL INFORMATION FORM FIELDS =====
  personalInfo: {
    // Personal Information 1
    surname: "tbxAPP_SURNAME",
    givenName: "tbxAPP_GIVEN_NAME",
    fullName: "tbxAPP_FULL_NAME_NATIVE_ALPHABET",
    gender: "rblAPP_GENDER",
    maritalStatus: "ddlAPP_MARITAL_STATUS",
    dateOfBirth: {
      day: "ddlDOBDay",
      month: "ddlDOBMonth",
      year: "tbxDOBYear",
    },
    cityOfBirth: "tbxAPP_POB_CITY",
    stateOfBirth: "tbxAPP_POB_ST_PROVINCE",
    countryOfBirth: "ddlAPP_POB_CNTRY",
    
    // Personal Information 2
    nationality: "ddlAPP_NATL",
    hasOtherNationality: "rblAPP_OTH_NATL_IND",
    isPermanentResident: "rblPermResOtherCntryInd",
    nationalId: "tbxAPP_NATIONAL_ID",
    nationalIdNA: "cbexAPP_NATIONAL_ID_NA",
    ssnParts: {
      part1: "tbxAPP_SSN1",
      part2: "tbxAPP_SSN2",
      part3: "tbxAPP_SSN3",
    },
    ssnNA: "cbexAPP_SSN_NA",
    taxId: "tbxAPP_TAX_ID",
    taxIdNA: "cbexAPP_TAX_ID_NA",
  },

  // ===== SECURITY QUESTION SELECTORS =====
  security: {
    // Security question dropdown
    questionDropdown: "#ctl00_SiteContentPlaceHolder_ddlQuestions",
    
    // Security answer input
    answerInput: "#ctl00_SiteContentPlaceHolder_tbSecurityAnswerConfirm",
    
    // Application ID display
    applicationId: "#ctl00_SiteContentPlaceHolder_lblApplicationIDDisplay",
    
    // I Agree checkbox
    agreeCheckbox: "#ctl00_SiteContentPlaceHolder_cbWarnings",
  },
};

/**
 * Helper function to get a complete selector with the ASP.NET naming convention
 * @param {string} partialId - The partial ID to search for
 * @returns {string} A CSS selector pattern
 */
export function buildSelector(partialId) {
  return `[id*="${partialId}"]`;
}

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  // Check if page has any validation errors
  hasErrors: () => {
    return (
      document.querySelector(DS160_SELECTORS.errors.validationSummary) !== null ||
      document.querySelector(DS160_SELECTORS.errors.validationSummaryAlt) !== null ||
      document.querySelectorAll(DS160_SELECTORS.errors.fieldError).length > 0
    );
  },
  
  // Get all error messages from the page
  getErrorMessages: () => {
    const errors = [];
    
    // Check main validation summary
    const summary = document.querySelector(DS160_SELECTORS.errors.validationSummary);
    if (summary) {
      errors.push(summary.textContent.trim());
    }
    
    // Check field-level errors
    const fieldErrors = document.querySelectorAll(DS160_SELECTORS.errors.fieldError);
    fieldErrors.forEach(error => {
      if (error.textContent.trim()) {
        errors.push(error.textContent.trim());
      }
    });
    
    return errors;
  },
};

export default DS160_SELECTORS;
