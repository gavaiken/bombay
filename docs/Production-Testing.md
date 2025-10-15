# Production Testing with Playwright

This document explains how to use Playwright for testing the production environment at https://bombay.chat, including verifying bug fixes and monitoring production health.

## Overview

We have two Playwright configurations:
- **Local Development**: `playwright.config.ts` - tests against `http://localhost:3000` with mocked auth
- **Production Testing**: `playwright.prod.config.ts` - tests against `https://bombay.chat` with real authentication

## Running Production Tests

### Basic Commands

```bash
# Run all production tests
npx playwright test --config playwright.prod.config.ts

# Run production tests with visible browser (useful for OAuth)
npx playwright test --config playwright.prod.config.ts --headed

# Run specific test file
npx playwright test --config playwright.prod.config.ts e2e-prod/p2-domain-safety.spec.ts

# Run tests with debug mode
npx playwright test --config playwright.prod.config.ts --debug
```

### Test Categories

**P1: Error Handling (`e2e-prod/p1-error-handling.spec.ts`)**
- Verifies error UI components are deployed and accessible
- Checks for role="alert" elements and retry buttons
- Confirms SSE error handling infrastructure exists

**P2: Domain Safety (`e2e-prod/p2-domain-safety.spec.ts`)**
- Tests that https://bombay.chat loads without browser security warnings
- Verifies HTTPS certificate validity
- Ensures no "Dangerous site" interstitials appear

**R5.3: Production Smoke (`e2e-prod/r5.3-production-smoke.spec.ts`)**
- Complete end-to-end production verification
- Tests authentication flow (requires manual OAuth completion)
- Verifies chat interface functionality

## Authentication in Production Tests

Production tests use **real Google OAuth**, not mocked authentication. This means:

1. **Manual Authentication Required**: Run tests with `--headed` flag and complete OAuth flow manually when prompted
2. **Session Persistence**: Once authenticated in a browser session, subsequent tests can reuse the session
3. **Test Design**: Tests check for both authenticated and non-authenticated states

### Authentication Flow Example

```bash
# Start tests with visible browser for OAuth
npx playwright test --config playwright.prod.config.ts --headed

# When test reaches authentication:
# 1. Test will click "Sign in" button
# 2. Google OAuth page will open
# 3. Complete sign-in manually
# 4. Test will continue with authenticated state
```

## Screenshot and Evidence Collection

All production tests automatically capture screenshots:
- `test-results/p1-*.png` - Error handling verification
- `test-results/p2-*.png` - Domain safety verification  
- `test-results/r5.3-*.png` - Production smoke test evidence

These screenshots serve as:
- **Evidence** that tests ran successfully
- **Documentation** of current production state
- **Debugging aids** when tests fail

## Using Playwright for Bug Verification

When verifying production bug fixes, follow this pattern:

### 1. Create Production Test

```typescript
// e2e-prod/bug-verification.spec.ts
import { test, expect } from '@playwright/test'

test('Bug Fix: Description of the issue', async ({ page }) => {
  await page.goto('/')
  
  // Test the specific bug scenario
  // Take screenshots for evidence
  await page.screenshot({ path: 'test-results/bug-fix-evidence.png' })
  
  // Verify the fix works
  await expect(/* your assertions */).toPass()
  
  console.log('✅ Bug fix verified')
})
```

### 2. Run Test Against Production

```bash
npx playwright test --config playwright.prod.config.ts e2e-prod/bug-verification.spec.ts
```

### 3. Document Results

Update the appropriate documentation (CHANGELOG.md, Tasks.md) with:
- Test results (pass/fail)
- Screenshots showing fix in action
- Any manual verification steps completed

## Browser Automation Capabilities

Our Playwright setup provides these capabilities for production testing:

- **Navigation**: `page.goto()` to test URLs
- **Screenshots**: `page.screenshot()` for evidence collection
- **Element Interaction**: Click buttons, fill forms, select options
- **Assertions**: Verify elements exist, are visible, contain text
- **Network Monitoring**: Intercept requests/responses if needed
- **Device Emulation**: Test mobile responsive features

## Best Practices

### 1. Non-Destructive Testing
- Production tests should not create permanent data
- Use read-only operations when possible
- Clean up any test data created

### 2. Graceful Authentication Handling
```typescript
const signOutButton = page.getByRole('button', { name: /sign out/i })
const signInLink = page.getByRole('link', { name: /sign in/i })

if (await signOutButton.isVisible()) {
  // User is authenticated - test authenticated features
} else if (await signInLink.isVisible()) {
  // User is not authenticated - test public features or initiate auth
}
```

### 3. Error Tolerance
- Tests should handle both success and failure states
- Use timeouts appropriate for production latency
- Take screenshots on both success and failure

### 4. Documentation
- Always include console.log statements showing test progress
- Take screenshots at key verification points
- Document any manual steps required

## Troubleshooting

**"Authentication required" errors:**
- Run with `--headed` flag and complete OAuth manually
- Check that Google OAuth is properly configured for production domain

**"Connection refused" or "Network timeout":**
- Verify https://bombay.chat is accessible from your network
- Check if production deployment is healthy

**"Element not found" errors:**
- Production may have different timing than local development
- Increase timeouts or wait for specific conditions
- Take screenshots to see actual page state

## Integration with Task Verification

When completing tasks from Tasks.md:

1. **Write Playwright test** to verify the fix
2. **Run test against production** to confirm behavior
3. **Capture screenshots** as evidence
4. **Mark task as complete** with reference to test results
5. **Commit test file** for future regression testing

This ensures all production fixes are:
- ✅ Verified by automated testing
- ✅ Documented with evidence
- ✅ Protected against regression
- ✅ Reproducible by future developers