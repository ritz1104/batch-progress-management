/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#FBFBFA',
          sidebar: '#F7F6F3',
          card: '#FFFFFF',
          border: '#E9E8E4',
          hover: '#EFEFED',
          active: '#E3E2E0',
          text: '#37352F',
          muted: '#787774',
          subtle: '#9B9A97',
        },
        // Notion database select tag colors
        ntag: {
          gray: { bg: '#F1F1EF', text: '#5A5A58', border: '#E3E2E0' },
          brown: { bg: '#F4EEEE', text: '#937264', border: '#E7DFDC' },
          orange: { bg: '#FAECE5', text: '#D9730D', border: '#F2D7C8' },
          yellow: { bg: '#FBF3DB', text: '#8F6B00', border: '#F4E5B8' },
          green: { bg: '#EDF3EC', text: '#0F7B6C', border: '#D4E5D3' },
          blue: { bg: '#E7F3F8', text: '#0B6E99', border: '#CDE5F0' },
          purple: { bg: '#F4F0F7', text: '#6940A5', border: '#E3DCED' },
          pink: { bg: '#FBF1F5', text: '#AD1A72', border: '#F4DCDE' },
          red: { bg: '#FDEBEC', text: '#E03E3E', border: '#F8D0D2' },
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'notion-dropdown': '0 1px 2px rgba(15, 15, 15, 0.05), 0 4px 16px rgba(15, 15, 15, 0.1)',
        'notion-modal': '0 8px 30px rgba(15, 15, 15, 0.12)',
        'notion-card': '0 1px 3px rgba(15, 15, 15, 0.04)'
      }
    },
  },
  plugins: [],
}
