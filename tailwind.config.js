/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // CampusCare design tokens (PRD §5.2)
        lavender: '#E9E4F5',
        mint: '#DDF1E8',
        skyblue: '#DCEAF5',
        warmwhite: '#FAFAF7',
        navy: '#283448',
        peach: '#F6E4DA',
        // Semantic
        primary: '#7C5CBF',   // Deep lavender for primary actions
        'primary-light': '#E9E4F5',
        success: '#4CAF82',
        warning: '#F5A623',
        danger: '#E05C5C',
        muted: '#8A9BB0',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
