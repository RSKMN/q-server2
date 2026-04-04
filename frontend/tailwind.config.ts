import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#070B16",
          muted: "#0C1326",
          elevated: "#111A33",
        },
        surface: {
          DEFAULT: "#111A33",
          subtle: "#172447",
          strong: "#1B2B54",
        },
        primary: {
          DEFAULT: "#6D7BFF",
          hover: "#8190FF",
          active: "#5B6AF2",
          foreground: "#EEF1FF",
        },
        accent: {
          DEFAULT: "#20D8C3",
          hover: "#36E7D1",
          active: "#17C7B3",
          foreground: "#022620",
        },
        text: {
          DEFAULT: "#E6ECFF",
          muted: "#A8B5DA",
          subtle: "#7E8CB8",
        },
        border: {
          DEFAULT: "#25365E",
          subtle: "#1D2A49",
          strong: "#2E4372",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "Sora", "Segoe UI", "sans-serif"],
        body: ["IBM Plex Sans", "Manrope", "Segoe UI", "sans-serif"],
      },
      spacing: {
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
        "3.5": "0.875rem",
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "7.5": "1.875rem",
        "8.5": "2.125rem",
        "9.5": "2.375rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      borderWidth: {
        DEFAULT: "1px",
        1: "1px",
        2: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
