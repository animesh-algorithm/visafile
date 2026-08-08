# DS-160 Frontend Integration Guide

This guide explains how to use the DS-160 selectors and API in a production frontend application.

## Overview

The automation provides two key modules for frontend integration:
- `selectors.js` - All CSS selectors for DS-160 form elements
- `frontend-api.js` - Helper functions and configuration for frontend use

## Quick Start

### 1. Import the Configuration

```javascript
import { FRONTEND_CONFIG, getCaptchaConfig, getErrorConfig } from './frontend-api.js';
```

### 2. Access Selectors in Your Frontend

#### CAPTCHA Integration

```javascript
// Get CAPTCHA configuration
const captchaConfig = getCaptchaConfig();

// Display CAPTCHA to user
function displayCaptcha() {
  const captchaImage = document.querySelector(captchaConfig.selectors.image);
  const captchaInput = document.querySelector(captchaConfig.selectors.input);
  
  // Send CAPTCHA image to frontend
  if (captchaImage) {
    const imageSrc = captchaImage.src;
    // Display imageSrc to user in your UI
    sendToFrontend({
      type: 'captcha_required',
      imageUrl: imageSrc,
      inputSelector: captchaConfig.selectors.input
    });
  }
}

// Submit CAPTCHA from user
function submitCaptcha(userInput) {
  const captchaInput = document.querySelector(captchaConfig.selectors.input);
  if (captchaInput) {
    captchaInput.value = userInput;
    // Trigger form submission or continue
  }
}
```

#### Error Handling

```javascript
// Get error configuration
const errorConfig = getErrorConfig();

// Check for validation errors
function checkForErrors() {
  if (errorConfig.hasErrors()) {
    const errors = errorConfig.getStructuredErrors();
    
    // Send errors to frontend
    sendToFrontend({
      type: 'validation_errors',
      errors: errors.map(err => ({
        type: err.type,
        message: err.message,
        fieldId: err.fieldId
      }))
    });
    
    return true;
  }
  return false;
}

// Example error object structure:
// {
//   type: 'field' | 'summary',
//   message: 'Error message text',
//   fieldId: 'field_identifier'
// }
```

### 3. Complete Integration Example

```javascript
import { FRONTEND_CONFIG, getCaptchaConfig, getErrorConfig, createMessage } from './frontend-api.js';

class DS160Frontend {
  constructor(websocket) {
    this.ws = websocket;
    this.captchaConfig = getCaptchaConfig();
    this.errorConfig = getErrorConfig();
  }
  
  // Monitor for CAPTCHA requests
  async checkCaptcha() {
    if (this.captchaConfig.isVisible()) {
      const imageSrc = this.captchaConfig.getImageSrc();
      
      // Send to frontend
      this.ws.send(JSON.stringify(
        createMessage('captcha_required', {
          imageUrl: imageSrc,
          timestamp: Date.now()
        })
      ));
    }
  }
  
  // Handle user's CAPTCHA submission
  async submitCaptcha(userInput) {
    const input = document.querySelector(this.captchaConfig.selectors.input);
    if (input) {
      input.value = userInput;
      
      // Trigger submission
      const submitBtn = document.querySelector(FRONTEND_CONFIG.selectors.navigation.startApplication);
      submitBtn?.click();
    }
  }
  
  // Check and report errors
  async checkErrors() {
    if (this.errorConfig.hasErrors()) {
      const errors = this.errorConfig.getStructuredErrors();
      
      this.ws.send(JSON.stringify(
        createMessage('errors_found', {
          count: errors.length,
          errors: errors
        })
      ));
      
      return errors;
    }
    return [];
  }
  
  // Monitor page state
  async monitorPage() {
    // Check for CAPTCHA
    await this.checkCaptcha();
    
    // Check for errors
    await this.checkErrors();
  }
}

// Usage in your backend/automation
const frontend = new DS160Frontend(websocketConnection);

// Set up monitoring interval
setInterval(() => {
  frontend.monitorPage();
}, 1000);
```

## Backend WebSocket Server Example

```javascript
import WebSocket from 'ws';
import { FRONTEND_CONFIG } from './frontend-api.js';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Frontend connected');
  
  // Send configuration to frontend
  ws.send(JSON.stringify({
    type: 'config',
    data: FRONTEND_CONFIG
  }));
  
  // Handle messages from frontend
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'captcha_response':
        // Handle CAPTCHA submission from user
        handleCaptchaSubmission(data.captcha);
        break;
        
      case 'request_errors':
        // Send current errors to frontend
        const errors = getPageErrors();
        ws.send(JSON.stringify({
          type: 'errors',
          data: errors
        }));
        break;
    }
  });
});
```

## Frontend (React Example)

```jsx
import React, { useState, useEffect } from 'react';

function DS160Monitor() {
  const [captchaImage, setCaptchaImage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [config, setConfig] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'config':
          setConfig(message.data);
          break;
          
        case 'captcha_required':
          setCaptchaImage(message.data.imageUrl);
          break;
          
        case 'validation_errors':
          setErrors(message.data.errors);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
  
  const handleCaptchaSubmit = (captcha) => {
    ws.send(JSON.stringify({
      type: 'captcha_response',
      captcha: captcha
    }));
  };
  
  return (
    <div>
      {captchaImage && (
        <div className="captcha-container">
          <img src={captchaImage} alt="CAPTCHA" />
          <input 
            type="text" 
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCaptchaSubmit(e.target.value);
              }
            }}
            placeholder="Enter CAPTCHA"
          />
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="errors-container">
          <h3>Validation Errors:</h3>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>
                <strong>{err.type}:</strong> {err.message}
                {err.fieldId && <span> (Field: {err.fieldId})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DS160Monitor;
```

## Available Selectors Reference

### CAPTCHA Selectors
```javascript
DS160_SELECTORS.captcha.input       // Input field for CAPTCHA
DS160_SELECTORS.captcha.image       // CAPTCHA image element
DS160_SELECTORS.captcha.container   // Container div
```

### Error Selectors
```javascript
DS160_SELECTORS.errors.validationSummary     // Main error summary
DS160_SELECTORS.errors.fieldError            // Field-level errors
DS160_SELECTORS.errors.errorSpan             // Error message spans
```

### Navigation Selectors
```javascript
DS160_SELECTORS.navigation.startApplication  // Start button
DS160_SELECTORS.navigation.nextButton        // Next button
DS160_SELECTORS.navigation.saveButton        // Save button
```

### Form Field Selectors
See `DS160_SELECTORS.personalInfo` for all personal information form fields.

## Message Types

All messages between backend and frontend follow this structure:

```javascript
{
  type: 'message_type',
  timestamp: '2026-08-08T14:56:26.237Z',
  data: { /* message-specific data */ }
}
```

### Message Types:
- `captcha_required` - CAPTCHA needs to be solved
- `validation_errors` - Form validation errors found
- `progress_update` - Form filling progress
- `page_changed` - Navigation to new page
- `form_completed` - Form submission complete

## API Endpoints

Configure these in your backend:

```javascript
POST /api/captcha/submit - Submit CAPTCHA solution
GET  /api/form/errors    - Get current validation errors
POST /api/form/save      - Save form progress
GET  /api/form/status    - Get current form status
```

## Testing

Use the provided selectors to write E2E tests:

```javascript
import { DS160_SELECTORS } from './selectors.js';

describe('DS-160 Form', () => {
  it('should display CAPTCHA', async () => {
    await page.waitForSelector(DS160_SELECTORS.captcha.image);
    const captchaVisible = await page.isVisible(DS160_SELECTORS.captcha.image);
    expect(captchaVisible).toBe(true);
  });
  
  it('should show validation errors', async () => {
    await page.click(DS160_SELECTORS.navigation.nextButton);
    const errors = await page.$$(DS160_SELECTORS.errors.fieldError);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

## Notes

- All selectors are based on the ASP.NET control naming convention
- Field IDs may have prefixes like `ctl00_SiteContentPlaceHolder_FormView1_`
- Use the `buildSelector()` helper for dynamic selector generation
- Error messages are captured in real-time during form filling
- CAPTCHA images may change/refresh - monitor for updates
