/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
            },
            colors: {
                brand: {
                    900: '#1a1a1a', // Deep Black/Charcoal
                    800: '#2d2d2d',
                    100: '#f5f5f5',
                    50: '#fafafa',
                },
                accent: {
                    500: '#d4af37', // Gold-ish
                    600: '#b4942d',
                }
            },
            keyframes: {
                swing: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '20%': { transform: 'rotate(15deg)' },
                    '40%': { transform: 'rotate(-10deg)' },
                    '60%': { transform: 'rotate(5deg)' },
                    '80%': { transform: 'rotate(-5deg)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                zoomIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                }
            },
            animation: {
                swing: 'swing 1s ease-in-out infinite',
                fadeIn: 'fadeIn 0.5s ease-out forwards',
                slideUp: 'slideUp 0.5s ease-out forwards',
                zoomIn: 'zoomIn 0.3s ease-out forwards',
            }
        },
    },
    plugins: [],
}
