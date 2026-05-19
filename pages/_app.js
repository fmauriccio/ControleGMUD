export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f5f5f3;
          color: #1a1a18;
          min-height: 100vh;
        }
        input, select, textarea, button { font-family: inherit; font-size: 14px; }
        a { color: #1AAB8A; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
