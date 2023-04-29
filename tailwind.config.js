/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./web/**/*"],
    daisyui: {
        themes: [
            {
                rosepinemoon: {
                    "primary": "#C4A7E7",
                    "secondary": "#EA9A97",
                    "accent": "#C4A7E7",
                    "neutral": "#2A273F",
                    "base-100": "#232136",
                    "info": "#3E8FB0",
                    "success": "#9CCFD8",
                    "warning": "#F6C177",
                    "error": "#EB6F92",
                },
            },
            {
                rosepinedawn: {
                    "primary": "#907AA9",
                    "secondary": "#D7827E",
                    "accent": "#907AA9",
                    "neutral": "#FFFAF3",
                    "base-100": "#FAF4ED",
                    "info": "#286983",
                    "success": "#56949F",
                    "warning": "#EA9D34",
                    "error": "#B4637A",
                }
            }
        ],
    },
    plugins: [require("daisyui")],
}
