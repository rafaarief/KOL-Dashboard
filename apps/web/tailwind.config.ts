import type { Config } from "tailwindcss";

export default {
  // lib/ is included because campaignVisuals.ts builds Tailwind gradient class names
  // (from-*/to-*) as data outside app/ or components/ — without this, Tailwind's content
  // scanner never sees those tokens and silently omits them from the generated CSS.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
        // Lavender-tinted mesh for hero/marketing surfaces only — dashboard and admin content
        // areas intentionally keep the neutral oc-bg token for readability (per design brief:
        // "public marketplace can be more visually expressive, admin/dashboard stay neutral").
        "oc-mesh":
          "radial-gradient(at 15% 20%, rgba(124,58,237,0.16) 0px, transparent 55%), radial-gradient(at 85% 15%, rgba(168,85,247,0.14) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(139,92,246,0.10) 0px, transparent 55%), #F5F3FF",
      },
      borderRadius: {
        "oc-lg": "24px",
        oc: "18px",
        "oc-input": "14px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
