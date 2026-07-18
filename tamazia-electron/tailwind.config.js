/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(32 35% 28%)',
        input: 'hsl(32 35% 28%)',
        ring: 'hsl(38 85% 55%)',
        background: 'hsl(24 45% 8%)',
        foreground: 'hsl(38 45% 92%)',
        card: 'hsl(28 40% 14%)',
        muted: 'hsl(30 30% 20%)',
        'muted-foreground': 'hsl(36 25% 68%)',
        primary: 'hsl(38 85% 55%)',
        'primary-foreground': 'hsl(24 45% 8%)',
        accent: 'hsl(14 70% 50%)',
        'accent-foreground': 'hsl(38 45% 92%)',
        destructive: 'hsl(0 65% 48%)',
        success: 'hsl(95 45% 45%)',
        sidebar: 'hsl(26 42% 11%)',
        sand: 'hsl(40 60% 70%)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
