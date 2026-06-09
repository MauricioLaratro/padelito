import type { Config } from "tailwindcss";

const tailwindConfiguration: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#0F1115",
          secondary: "#1A1D22",
        },
        surface: {
          primary: "#15181D",
          secondary: "#20242B",
        },
        text: {
          primary: "#D9D9D9",
          secondary: "#A6A6A6",
        },
        accent: {
          lime: "#D7F21A",
        },
        border: {
          subtle: "rgba(217, 217, 217, 0.12)",
        },
        feedback: {
          danger: "#FF5A5F",
          success: "#8EEA7A",
        },
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "Sora", "system-ui", "sans-serif"],
      },
      maxWidth: {
        mobile: "480px",
      },
      boxShadow: {
        floating: "0 18px 40px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
};

export default tailwindConfiguration;
