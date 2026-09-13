import { Html, Head, Main, NextScript } from "next/document";

export default function Document(props) {
  const locale = props.__NEXT_DATA__?.locale || "en";

  return (
    <Html lang={locale} dir="ltr">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
