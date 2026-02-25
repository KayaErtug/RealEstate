/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2c3e50',
          hover: '#1a252f',
        },
        cta: {
          DEFAULT: '#27ae60',
          hover: '#1f8b4c',
        },
        whatsapp: '#25d366',
      },
    },
  },
  plugins: [],
};
