import { NextResponse } from 'next/server'


export function middleware(request) {


        if (request.nextUrl.pathname.startsWith('/user')) {
                //  let authres = NextResponse.redirect(new URL('/login', req.url))    
                //     authres.cookies.set("supabase-auth-id", "havana");
                //     return authres
                let auths = request.cookies.has('authed') || request.cookies.has('authdata');
                if (!auths) {
                        console.log('redirect')
                        return NextResponse.redirect(new URL('/login', request.url));
                } else {
                        let cooks = request.cookies.get('authed')?.value;
                        console.log(cooks);
                }
        }

        //   if (request.nextUrl.pathname.startsWith('/dashboard')) {
        //     return NextResponse.rewrite(new URL('/dashboard/user', request.url))
        //   }
}