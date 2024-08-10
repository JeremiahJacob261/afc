// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import cookie from "cookie";
export default function handler(req, res) {

    res.setHeader("Set-Cookie", cookie.serialize("viewedWelcomeMessage", "true"));

    const theme = req.cookies;
    console.log(theme)
    res.status(200).json({ name: 'John Doe' })
  }
  