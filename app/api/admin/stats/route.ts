import { NextRequest, NextResponse } from 'next/server';
import { requestThrottler } from '@/lib/request-throttler';

export async function GET(request: NextRequest) {
  try {
    const cacheStats = requestThrottler.getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        cache: cacheStats,
        timestamp: new Date().toISOString(),
        message: 'Request throttling is active to prevent excessive API calls'
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
