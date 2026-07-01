import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
                extend: {
                    fontFamily: {
                        display: ['Clash Display', 'sans-serif'],
                        sans: ['Satoshi', 'sans-serif'],
                    },
                    colors: {
                        black: '#0a0a0a',
                        neva: '#e5e5e5',
                    },
                    animation: {
                        'slow-pan': 'pan 20s linear infinite',
                    },
                    keyframes: {
                        pan: {
                            '0%': { backgroundPosition: '0% 50%' },
                            '100%': { backgroundPosition: '100% 50%' },
                        }
                    }
                }
            },
  safelist: [
    'text-amber-400',
    'hover:text-amber-400',
  ],
  plugins: [],
};
export default config;
