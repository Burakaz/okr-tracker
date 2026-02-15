import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f5f0",
        foreground: "#1a1a1a",
        cream: {
          50: "#fafaf8",
          100: "#f8f8f5",
          200: "#f5f5f0",
          300: "#e8e8e3",
          400: "#d4d4cf",
          500: "#b8b8b3",
        },
        warm: {
          50: "#faf9f7",
          100: "#f5f4f0",
          200: "#e5e0d5",
          300: "#d4cfc4",
          400: "#b8b3a8",
          500: "#9c9790",
        },
        accent: {
          green: "#22c55e",
          greenLight: "#dcfce7",
          greenDark: "#16a34a",
        },
        muted: {
          DEFAULT: "#6b6b6b",
          light: "#9a9a9a",
        },
      },
      boxShadow: {
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'cardHover': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
