import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Fluid/container-based breakpoints
      'container-sm': '640px',
      'container-md': '768px',
      'container-lg': '1024px',
      'container-xl': '1280px',
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          'sm': '1.5rem',
          'lg': '2rem',
          'xl': '2.5rem',
          '2xl': '3rem',
        },
      },
      // Fluid typography
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
      },
      // Fluid spacing
      spacing: {
        'fluid-1': 'clamp(0.25rem, 1vw, 0.5rem)',
        'fluid-2': 'clamp(0.5rem, 2vw, 1rem)',
        'fluid-3': 'clamp(0.75rem, 3vw, 1.5rem)',
        'fluid-4': 'clamp(1rem, 4vw, 2rem)',
        'fluid-6': 'clamp(1.5rem, 6vw, 3rem)',
        'fluid-8': 'clamp(2rem, 8vw, 4rem)',
      },
    },
  },
  plugins: [],
};
export default config;
