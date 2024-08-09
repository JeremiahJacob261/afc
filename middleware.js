import { NextResponse } from 'next/server'
 

export function middleware(req,res) {

        const theme = req.cookies;
    console.log(theme)
//   if (req.nextUrl.pathname.startsWith('/user')) {
//  let authres = NextResponse.redirect(new URL('/login', req.url))    
//     authres.cookies.set("supabase-auth-id", "havana");
//     return authres
//   }
 
//   if (request.nextUrl.pathname.startsWith('/dashboard')) {
//     return NextResponse.rewrite(new URL('/dashboard/user', request.url))
//   }
}