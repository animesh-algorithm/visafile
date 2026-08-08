# DS-160 Selectors & API - Quick Start

## What's Included

This DS-160 automation now includes production-ready selector exports for frontend integration:

### Files Created

1. **`src/selectors.js`** - All DS-160 form selectors (CAPTCHA, errors, form fields, navigation)
2. **`src/frontend-api.js`** - Helper functions and utilities for frontend integration
3. **`src/api-server.js`** - REST API server to expose selectors
4. **`FRONTEND_INTEGRATION.md`** - Complete integration guide with examples

## Quick Start

### Option 1: Use Selectors Directly

Import selectors in your code:

```javascript
import { DS160_SELECTORS } from './src/selectors.js';

// Access CAPTCHA selectors
console.log(DS160_SELECTORS.captcha.image);
// Output: #ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_imgCaptcha

// Access error selectors
console.log(DS160_SELECTORS.errors.validationSummary);
// Output: #ctl00_SiteContentPlaceHolder_ValidationSummary1
```

### Option 2: Use Frontend API

```javascript
import { getCaptchaConfig, getErrorConfig } from './src/frontend-api.js';

// Get CAPTCHA configuration
const captcha = getCaptchaConfig();
console.log(captcha.selectors);

// Get error configuration with helper functions
const errors = getErrorConfig();
const hasErrors = errors.hasErrors();
const errorMessages = errors.getErrorMessages();
```

### Option 3: Run REST API Server

1. Install dependencies:
```bash
npm install express cors
```

2. Add to your `package.json`:
```json
{
  "scripts": {
    "api": "node src/api-server.js"
  }
}
```

3. Start the API server:
```bash
npm run api
```

4. Access endpoints:
```bash
# Get all configuration
curl http://localhost:3001/api/config

# Get CAPTCHA selectors
curl http://localhost:3001/api/selectors/captcha

# Get error selectors
curl http://localhost:3001/api/selectors/errors

# Get navigation selectors
curl http://localhost:3001/api/selectors/navigation

# Get form field selectors for Personal Info 1
curl http://localhost:3001/api/selectors/form/personalInfo1

# Build custom selector
curl http://localhost:3001/api/helper/build-selector/ddlNationality
```

## Production Usage Examples

### Frontend - Fetch Selectors via API

```javascript
// React/Vue/Angular component
async function fetchSelectors() {
  const response = await fetch('http://localhost:3001/api/config');
  const { data } = await response.json();
  
  // data.captcha contains CAPTCHA selectors
  // data.errors contains error selectors
  // data.selectors contains all selectors
  
  return data;
}
```

### Display CAPTCHA to User

```javascript
const config = await fetch('http://localhost:3001/api/selectors/captcha').then(r => r.json());

// Use selectors to find CAPTCHA image
const captchaImageSelector = config.data.selectors.image;
// Send this selector to your Puppeteer/automation backend
```

### Check for Validation Errors

```javascript
const errorConfig = await fetch('http://localhost:3001/api/selectors/errors').then(r => r.json());

// Use in your page evaluation
const hasErrors = await page.evaluate((selectors) => {
  return document.querySelector(selectors.validationSummary) !== null;
}, errorConfig.data.selectors);

if (hasErrors) {
  // Extract error messages and send to frontend
  const errors = await page.evaluate((selectors) => {
    const summary = document.querySelector(selectors.validationSummary);
    return summary ? summary.textContent : null;
  }, errorConfig.data.selectors);
  
  // Send to frontend via WebSocket or HTTP
  sendToFrontend({ type: 'errors', messages: errors });
}
```

## API Endpoints Reference

```
GET  /health                              - Health check
GET  /api/documentation                   - API documentation
GET  /api/config                          - Complete configuration
GET  /api/selectors                       - All selectors
GET  /api/selectors/captcha               - CAPTCHA selectors only
GET  /api/selectors/errors                - Error selectors only
GET  /api/selectors/navigation            - Navigation button selectors
GET  /api/selectors/form/:page            - Form page selectors (personalInfo1, personalInfo2)
GET  /api/helper/build-selector/:id       - Build selector from partial ID
```

## Integration Patterns

### Pattern 1: WebSocket Real-time Updates

```javascript
// Backend sends updates
ws.send(JSON.stringify({
  type: 'captcha_required',
  data: {
    imageSelector: DS160_SELECTORS.captcha.image,
    inputSelector: DS160_SELECTORS.captcha.input
  }
}));

// Frontend receives and displays
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'captcha_required') {
    displayCaptchaToUser(msg.data);
  }
};
```

### Pattern 2: REST API Polling

```javascript
// Frontend polls for status
setInterval(async () => {
  const status = await fetch('/api/form/status').then(r => r.json());
  
  if (status.needsCaptcha) {
    displayCaptchaModal();
  }
  
  if (status.hasErrors) {
    displayErrors(status.errors);
  }
}, 2000);
```

### Pattern 3: Direct Evaluation

```javascript
import { DS160_SELECTORS } from './src/selectors.js';

// In your Puppeteer code
const captchaVisible = await page.evaluate((selector) => {
  const el = document.querySelector(selector);
  return el && el.offsetParent !== null;
}, DS160_SELECTORS.captcha.image);

if (captchaVisible) {
  // Notify frontend that user needs to solve CAPTCHA
}
```

## Environment Variables

Add to your `.env` file:

```bash
# API Server Port
API_PORT=3001

# Enable CORS for specific origin (production)
CORS_ORIGIN=https://your-frontend-domain.com

# API authentication (optional)
API_KEY=your-secret-api-key
```

## Next Steps

1. Read `FRONTEND_INTEGRATION.md` for detailed integration examples
2. Start the API server: `npm run api`
3. Test endpoints: `curl http://localhost:3001/api/documentation`
4. Integrate with your frontend using the provided examples
5. Deploy to production with proper CORS and authentication

## Support

For issues or questions:
1. Check `FRONTEND_INTEGRATION.md` for detailed examples
2. Review the code in `src/selectors.js` and `src/frontend-api.js`
3. Test endpoints using the API server

## License

Use freely for your DS-160 automation project.
