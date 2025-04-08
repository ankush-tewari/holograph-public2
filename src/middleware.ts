// src/middleware.ts (create this file in your src directory)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { debugLog } from './utils/debug';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Only add CORS headers for API routes
  if (path.startsWith('/api/')) {
    console.log("Middleware: Adding CORS headers to", path);
    
    // Create a response
    const response = NextResponse.next();

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: ['/api/:path*'],
};