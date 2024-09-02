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
    },
    variants: {
        extend: {
            backgroundColor: ["dark", "hover"],
            textColor: ["dark"],
        },
    },
    plugins: [],
};
