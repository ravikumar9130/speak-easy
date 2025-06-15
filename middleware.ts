import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get response headers
  const response = NextResponse.next();
  
  // Set CORS headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  return response;
}

// Apply middleware only to the API route handling transcription
export const config = {
  matcher: '/api/transcribe',
};