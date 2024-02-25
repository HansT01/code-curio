/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'secondary': 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
      },
    },
  },
  plugins: [],
}
