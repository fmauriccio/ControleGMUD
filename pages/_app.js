export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: dark; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0D1117;
          color: #E6EDF3;
          min-height: 100vh;
        }
        input, select, textarea, button { font-family: inherit; }
        a { color: #1AAB8A; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #161B22; }
        ::-webkit-scrollbar-thumb { background: #30363D; border-radius: 3px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
        ::placeholder { color: #6E7681; }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
