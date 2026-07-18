/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(200 40% 30%)',
        input: 'hsl(200 40% 30%)',
        ring: 'hsl(187 85% 50%)',
        background: 'hsl(200 60% 7%)',
        foreground: 'hsl(190 50% 94%)',
        card: 'hsl(198 55% 13%)',
        muted: 'hsl(200 35% 20%)',
        'muted-foreground': 'hsl(195 25% 68%)',
        primary: 'hsl(187 85% 50%)',
        'primary-foreground': 'hsl(200 60% 7%)',
        accent: 'hsl(205 90% 55%)',
        'accent-foreground': 'hsl(190 50% 94%)',
        destructive: 'hsl(0 65% 48%)',
        success: 'hsl(160 60% 45%)',
        sidebar: 'hsl(200 55% 10%)',
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
