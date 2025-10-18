import { NextRequest } from 'next/server';
import { prisma } from 'lib/prisma';

export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTimeMs?: number;
    };
    providers: {
      openai: 'configured' | 'missing';
      anthropic: 'configured' | 'missing';
    };
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp,
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: 'down'
      },
      providers: {
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'
      }
    },
    uptime
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    
    healthStatus.checks.database = {
      status: 'up',
      responseTimeMs: dbTime
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: 'down'
    };
    healthStatus.status = 'unhealthy';
  }

  // Determine overall health status
  if (healthStatus.checks.database.status === 'down') {
    healthStatus.status = 'unhealthy';
  }

  const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

  return new Response(JSON.stringify(healthStatus, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}