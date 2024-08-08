/** @type {import('tailwindcss').Config} */

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#212121",
                sidebar: "#171717",
                sidebardarker: "#0d0d0d",
            },
        },
    },
    plugins: [],
};
