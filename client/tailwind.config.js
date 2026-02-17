/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1c150dff",
                "primary-hover": "#B45309",
                accent: "#F59E0B",
                "background-light": "#F3F2EC",
                "surface-light": "#FFFFFF",
                "text-main-light": "#1A1A1A",
                "text-muted-light": "#525252",
                "accent-sepia": "#F4ECD8",
                "border-light": "#E5E7EB",
            },
            fontFamily: {
                display: ["'Playfair Display'", "serif"],
                body: ["'Inter'", "sans-serif"],
                reader: ["'Merriweather'", "serif"],
            },
            boxShadow: {
                'book': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'book-hover': '0 25px 30px -5px rgba(0, 0, 0, 0.2), 0 15px 15px -5px rgba(0, 0, 0, 0.1)',
            },
            maxWidth: {
                'reader': '760px',
            },
        },
    },
    plugins: [],
}
