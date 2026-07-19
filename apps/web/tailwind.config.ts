import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OpenCollab.id brand palette — the pre-existing KOL Finder / Business Leads areas
        // keep using stock Tailwind slate/indigo and are untouched by this extension.
        oc: {
          900: "#4C1D95",
          700: "#6D28D9",
          600: "#7C3AED",
          500: "#8B5CF6",
          400: "#A78BFA",
          300: "#C4B5FD",
          bg: "#F7F7FB",
          card: "#FFFFFF",
          ink: "#18181B",
          "ink-muted": "#71717A",
          border: "#E4E4E7",
        },
      },
      backgroundImage: {
        "oc-gradient": "linear-gradient(135deg, #6B46C1 0%, #A78BFA 100%)",
      },
      borderRadius: {
        "oc-lg": "24px",
        oc: "18px",
        "oc-input": "14px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
