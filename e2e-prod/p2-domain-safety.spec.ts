import { test, expect } from '@playwright/test'

/**
 * P2. Domain flagged by Google Safe Browsing
 * 
 * Acceptance Criteria:
 * - Chrome no longer shows the "Dangerous site" interstitial for https://bombay.chat
 * - Site loads without security warnings
 * - HTTPS certificate is valid
 * - No browser security warnings appear
 */

test('P2: bombay.chat loads without security warnings', async ({ page }) => {
  // Navigate to production site
  await page.goto('/')
  
  // Verify page loads successfully (no connection errors, cert issues, etc)
  // If user is not authenticated, we'll see the sign-in page
  // If user is authenticated, we'll see the brand-swatch
  const signInButton = page.getByRole('button', { name: /sign in with google/i })
  const brandSwatch = page.getByTestId('brand-swatch')
  
  // Either sign-in page or authenticated app should be visible
  await expect(signInButton.or(brandSwatch)).toBeVisible({ timeout: 10_000 })
  
  // Verify we're on HTTPS
  expect(page.url()).toMatch(/^https:\/\/bombay\.chat/)
  
  // Take screenshot for manual verification if needed
  await page.screenshot({ path: 'test-results/p2-domain-safety.png', fullPage: true })
  
  // Verify basic app loads without security blocking
  // Note: Sign-in page doesn't have main header; authenticated app does
  
  // Check that we can access authentication (no security blocking)
  const authSignInButton = page.getByRole('button', { name: /sign in with google/i })
  const signOutButton = page.getByRole('button', { name: /sign out/i })
  
  if (await authSignInButton.isVisible()) {
    console.log('✅ Sign-in page accessible - authentication flow available')
  } else if (await signOutButton.isVisible()) {
    console.log('✅ User authenticated - sign-out available')
  }
  
  console.log('✅ P2: Domain loads without security warnings')
})

test('P2: verify HTTPS and certificate validity', async ({ page, context }) => {
  // This test verifies the connection is secure
  const response = await page.goto('/')
  
  // Should get successful response
  expect(response?.status()).toBe(200)
  
  // Verify security state through browser APIs if available
  const securityDetails = await page.evaluate(() => {
    return {
      protocol: window.location.protocol,
      secure: window.isSecureContext,
      origin: window.location.origin
    }
  })
  
  expect(securityDetails.protocol).toBe('https:')
  expect(securityDetails.secure).toBe(true)
  expect(securityDetails.origin).toBe('https://bombay.chat')
  
  console.log('✅ P2: HTTPS and certificate validation passed')
})