// /src/api/auth/logout/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { debugLog } from '@/utils/debug'

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  )

  // Clear the auth cookie
  response.cookies.delete('auth-token')

  return response
}
