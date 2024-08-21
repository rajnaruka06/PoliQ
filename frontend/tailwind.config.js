/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#212121",
                sidebar: "#171717",
                sidebardarker: "#0d0d0d",
                grey: "#2f2f2f", // Fixed color value by adding '#'
                gray: "#f7f7f7",
            },
        },
    },
    plugins: [],
};

