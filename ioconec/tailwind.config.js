/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

    darkMode: 'media', // or 'media' or 'class'
    theme: {
        extend: {
            keyframes: {},
            animation: {},
        },
    },
    variants: {
        extend: {},
    },
    plugins: [require("daisyui")],
}