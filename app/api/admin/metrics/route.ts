import { NextRequest } from 'next/server';
import { getUsageMetrics } from 'lib/metrics';
import { requireUser } from 'lib/authz';
import { jsonError } from 'lib/errors';

export const runtime = 'nodejs';

// Admin email addresses that can access metrics
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  // Add more admin emails as needed
].filter(Boolean);

/**
 * Admin-only endpoint to retrieve usage metrics
 */
export async function GET(req: NextRequest) {
  // Require authentication
  const gate = await requireUser();
  if (!gate.ok) return gate.error;
  
  const user = gate.user;
  
  // Check if user is admin
  if (!ADMIN_EMAILS.includes(user.email)) {
    return jsonError('FORBIDDEN', 'Admin access required', 403);
  }

  try {
    const metrics = await getUsageMetrics();
    
    // Add additional metadata
    const response = {
      metrics,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      note: 'Usage metrics - no individual message content is stored'
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        // Add CORS headers if needed for admin dashboards
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://admin.bombay.chat',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch metrics', 500);
  }
}