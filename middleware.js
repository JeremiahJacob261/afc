import { NextResponse } from 'next/server'

export function middleware() {
  // Protected pages now validate the Supabase session in the browser and
  // protected API routes validate the access token server-side. The previous
  // middleware trusted user-editable cookies and could be bypassed.
  return NextResponse.next()
}
