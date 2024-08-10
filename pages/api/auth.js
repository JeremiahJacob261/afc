// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import cookie from "cookie";
export default function handler(req, res) {

    // res.setHeader("Set-Cookie", cookie.serialize("viewedWelcomeMessage", "true"));
   
  // Parsing the JSON string to obtain the object
  
    const theme = req.cookies.authdata;
    // const decodedString = decodeURIComponent(theme);
    // const jsonObject = JSON.parse(decodedString);
    console.log(theme)
    res.status(200).json(theme)
  }
  