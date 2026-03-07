/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg:           '#f5f5f7',
          surface:      '#ffffff',
          text:         '#1c2f3e',        // KOOKY navy
          secondary:    '#5a7080',        // muted navy-gray
          blue:         '#e8722a',        // KOOKY orange (replaces Apple blue)
          'blue-hover': '#d4621a',        // darker orange on hover
          border:       '#d2d2d7',
          divider:      '#e8ecee',
          green:        '#34c759',
          'green-bg':   '#f0fdf4',
          navy:         '#1c2f3e',        // KOOKY navy (direct reference)
          orange:       '#e8722a',        // KOOKY orange (direct reference)
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        pill: '100px',
      },
      boxShadow: {
        'apple-card':       '0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        'apple-card-hover': '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
        'apple-btn':        '0 1px 3px rgba(232,114,42,0.35)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
