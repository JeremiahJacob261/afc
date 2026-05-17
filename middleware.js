import { NextResponse } from 'next/server'

export function middleware(request) {
        if (request.nextUrl.pathname.startsWith('/user')) {
                console.log("hello middleware")
                //  let authres = NextResponse.redirect(new URL('/login', req.url))    
                //     authres.cookies.set("supabase-auth-id", "havana");
                //     return authres
                let auths = request.cookies.has('authed') || request.cookies.has('authdata');
                if (!auths) {
                        console.log('redirect',auths)
                        return NextResponse.redirect(new URL('/login', request.url));
                } else {
                        let cooks = request.cookies.get('authed')?.value;
                        let cookdata = JSON.parse(request.cookies.get('authdata')?.value);
                        console.log(cooks);
                        let name = cookdata['username'];
                        console.log(name);
                        console.log(cookdata);
                        // processBets(name);
                }
        }

        //   if (request.nextUrl.pathname.startsWith('/dashboard')) {
        //     return NextResponse.rewrite(new URL('/dashboard/user', request.url))
        //   }
}