/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#130e0d',
        surface: '#1d1513',
        raised: '#291d19',
        accent: '#e99a45',
        ink: '#f2eee8',
        muted: '#aaa19a',
      },
      fontFamily: { mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
};
