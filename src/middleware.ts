// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { debugLog } from './utils/debug';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Handle OPTIONS requests specially for CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', 'https://www.holographcompany.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    return response;
  }

  // Only add CORS headers for API routes
  if (path.startsWith('/api/')) {
    console.log("Middleware: Adding CORS headers to", path);
    
    // Create a response
    const response = NextResponse.next();

    // Update CORS headers - the '*' wildcard won't work with credentials
    response.headers.set('Access-Control-Allow-Origin', 'https://www.holographcompany.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: ['/api/:path*'],
};