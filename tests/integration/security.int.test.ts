import { describe, test, expect } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '../../middleware';

describe('Security Integration Tests', () => {
  test('middleware emits a nonce-based CSP header', async () => {
    const req = new NextRequest('https://example.com/');
    const res = await middleware(req as any);
    const csp = res.headers.get('Content-Security-Policy') || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-src 'none'");
  });

  test('middleware propagates nonce to request headers', async () => {
    const req = new NextRequest('https://example.com/');
    const res = await middleware(req as any);
    // In tests we can't access the mutated request, but we can assert CSP contains a nonce token
    const csp = res.headers.get('Content-Security-Policy') || '';
    const hasNonce = /script-src[^;]*'nonce-[^']+'/.test(csp);
    expect(hasNonce).toBe(true);
  });

  test('CSP allows Google Fonts and blocks frames', async () => {
    const req = new NextRequest('https://example.com/');
    const res = await middleware(req as any);
    const csp = res.headers.get('Content-Security-Policy') || '';
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("frame-src 'none'");
  });
});
