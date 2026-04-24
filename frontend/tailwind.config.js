/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        radar:   { DEFAULT: '#00f5a0', dark: '#00d68f' },
        alert:   { DEFAULT: '#ff4757', dark: '#c0392b' },
        warn:    { DEFAULT: '#ffa502', dark: '#e67e22' },
        panel:   { DEFAULT: '#0d1117', light: '#161b22', border: '#21262d' },
        ink:     { DEFAULT: '#e6edf3', muted: '#8b949e' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'monospace'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':     'slideIn 0.3s ease-out',
        'fade-in':      'fadeIn 0.5s ease-out',
        'glow':         'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn:  { from: { transform: 'translateY(-10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        glow:     { from: { boxShadow: '0 0 5px #00f5a0' }, to: { boxShadow: '0 0 20px #00f5a0, 0 0 40px #00f5a040' } },
      },
    },
  },
  plugins: [],
}
