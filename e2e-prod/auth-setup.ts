/**
 * Production Authentication Setup
 * 
 * Industry standard approach: Use a dedicated test account with persistent session storage
 * This allows testing authenticated flows in production without manual intervention
 */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to production sign-in
  await page.goto('/');
  
  // Check if already authenticated
  if (await page.getByRole('button', { name: /sign out/i }).isVisible()) {
    console.log('✅ Already authenticated');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Start OAuth flow
  const signInButton = page.getByRole('button', { name: /sign in with google/i });
  if (await signInButton.isVisible()) {
    console.log('🔐 Starting OAuth flow...');
    
    // Option 1: Manual OAuth (run once with --headed)
    if (process.env.MANUAL_AUTH === '1') {
      await signInButton.click();
      
      // Wait for manual OAuth completion
      console.log('⏳ Complete OAuth manually in browser...');
      await page.waitForURL('https://bombay.chat/', { timeout: 120_000 });
      
      // Verify authentication succeeded
      await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
      
      // Save authenticated state
      await page.context().storageState({ path: authFile });
      console.log('✅ Authentication saved to', authFile);
      
    } else {
      // Option 2: Use test credentials (if available)
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (testEmail && testPassword) {
        // Implement automated OAuth flow here
        // This requires specific Google OAuth test setup
        console.log('🤖 Using automated test credentials');
      } else {
        throw new Error('No authentication method available. Set MANUAL_AUTH=1 or provide test credentials');
      }
    }
  }
});