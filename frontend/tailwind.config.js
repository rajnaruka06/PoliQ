/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class", // Enable dark mode with 'class'
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                darkPrimary: "#212121",
                darkSecondary: "#171717",
                darkTertiary: "#0d0d0d",
                lightPrimary: "#ffffff",
                lightSecondary: "rgb(249, 249, 249)",
                lightTertiary: "rgb(244, 244, 244)",
                textGray: "#7d7d7d",
            },
        },
        screens: {
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
            "3xl": "2000px",
        },
    },
    variants: {
        extend: {
            backgroundColor: ["dark", "hover"],
            textColor: ["dark"],
        },
    },
    plugins: [],
};
