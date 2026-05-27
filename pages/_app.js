export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0A0F1E;
          color: #E2E8F0;
        }
        input, select, textarea, button { font-family: inherit; }
        a { color: #1AAB8A; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        ::placeholder { color: #475569; }
        option { background: #1E293B; color: #E2E8F0; }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
