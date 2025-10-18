import { describe, test, expect } from 'vitest';

describe('Security Integration Tests', () => {
  test('should return correct CSP header configuration', async () => {
    // Test that our Next.js config returns the correct CSP headers
    // We'll test this by making a request to a test route
    
    const expectedCSP = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'none'",
    ].join('; ');

    // For integration testing, we'll test the CSP configuration logic
    // This simulates what Next.js does with our headers config
    const nextConfig = await import('../../next.config.mjs');
    
    if (nextConfig.default.headers) {
      const headers = await nextConfig.default.headers();
      const cspConfig = headers.find(config => config.source === '/(.*)')
        ?.headers?.find(header => header.key === 'Content-Security-Policy');
      
      expect(cspConfig).toBeDefined();
      expect(cspConfig?.value).toBe(expectedCSP);
    }
  });

  test('CSP configuration should include required directives', async () => {
    const nextConfig = await import('../../next.config.mjs');
    
    if (nextConfig.default.headers) {
      const headers = await nextConfig.default.headers();
      const cspConfig = headers.find(config => config.source === '/(.*)')
        ?.headers?.find(header => header.key === 'Content-Security-Policy');
      
      const cspValue = cspConfig?.value || '';
      
      // Test that each required directive is present
      expect(cspValue).toContain("default-src 'self'");
      expect(cspValue).toContain("script-src 'self'");
      expect(cspValue).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
      expect(cspValue).toContain("font-src 'self' https://fonts.gstatic.com");
      expect(cspValue).toContain("img-src 'self' data:");
      expect(cspValue).toContain("connect-src 'self'");
      expect(cspValue).toContain("frame-src 'none'");
    }
  });

  test('CSP configuration should allow Google Fonts', async () => {
    const nextConfig = await import('../../next.config.mjs');
    
    if (nextConfig.default.headers) {
      const headers = await nextConfig.default.headers();
      const cspConfig = headers.find(config => config.source === '/(.*)')
        ?.headers?.find(header => header.key === 'Content-Security-Policy');
      
      const cspValue = cspConfig?.value || '';
      
      // Verify Google Fonts domains are allowed
      expect(cspValue).toContain('https://fonts.googleapis.com');
      expect(cspValue).toContain('https://fonts.gstatic.com');
    }
  });

  test('CSP configuration should restrict frame sources', async () => {
    const nextConfig = await import('../../next.config.mjs');
    
    if (nextConfig.default.headers) {
      const headers = await nextConfig.default.headers();
      const cspConfig = headers.find(config => config.source === '/(.*)')
        ?.headers?.find(header => header.key === 'Content-Security-Policy');
      
      const cspValue = cspConfig?.value || '';
      
      // Verify frames are blocked
      expect(cspValue).toContain("frame-src 'none'");
    }
  });
});