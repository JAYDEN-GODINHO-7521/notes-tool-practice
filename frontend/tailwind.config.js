/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F3EC",
        ink: "#221F1A",
        moss: {
          DEFAULT: "#2F5D50",
          dark: "#234539",
          light: "#3F7364",
        },
        gold: {
          DEFAULT: "#C9922E",
          light: "#E4B562",
        },
        line: "#E4DFD3",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "monospace"],
      },
    },
  },
  plugins: [typography],
};
