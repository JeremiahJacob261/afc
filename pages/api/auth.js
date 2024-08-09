// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import { setCookie } from 'cookies-next';
export default function handler(req, res) {
    
    setCookie(res, 'user', true, {
        path: '/',
      });

      
    const theme = req.cookies;
    // console.log(theme)
    res.status(200).json({ name: 'John Doe' })
  }
  