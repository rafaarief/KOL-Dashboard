import type { Config } from "tailwindcss";

export default {
  // lib/ is included because campaignVisuals.ts builds Tailwind gradient class names
  // (from-*/to-*) as data outside app/ or components/ — without this, Tailwind's content
  // scanner never sees those tokens and silently omits them from the generated CSS.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OpenCollab.id brand palette — warm coral/terracotta system (playful marketplace
        // aesthetic) replacing the earlier lavender scheme. The pre-existing KOL Finder /
        // Business Leads areas keep using stock Tailwind slate/indigo and are untouched.
        oc: {
          900: "#7A2410",
          700: "#C93E20",
          600: "#F2542D",
          500: "#FF7A54",
          400: "#FF9B7D",
          300: "#FFC4AD",
          bg: "#FFF8F2",
          card: "#FFFFFF",
          dark: "#241812",
          "dark-muted": "#A6947F",
          ink: "#241812",
          "ink-muted": "#8A7566",
          border: "#F1E2D3",
        },
        // Cyclable pastel tile backgrounds for card art (avatars, cover fallbacks) — mirrors
        // the colorful grid of tiles in the reference marketplace design.
        tile: {
          mint: "#DDF3E1",
          butter: "#FFF0BE",
          sky: "#DCEBFB",
          lavender: "#EAE1FB",
          blush: "#FFE0D6",
          sand: "#F5E9D6",
        },
      },
      backgroundImage: {
        "oc-gradient": "linear-gradient(135deg, #FFB199 0%, #FF7A54 45%, #F2542D 100%)",
        "oc-gradient-dark": "linear-gradient(135deg, #3A2A1E 0%, #241812 100%)",
        // Warm mesh for hero/marketing surfaces only — dashboard and admin content areas
        // intentionally keep the neutral oc-bg token for readability (per design brief:
        // "public marketplace can be more visually expressive, admin/dashboard stay neutral").
        "oc-mesh":
          "radial-gradient(at 12% 15%, rgba(242,84,45,0.16) 0px, transparent 55%), radial-gradient(at 88% 12%, rgba(255,196,173,0.45) 0px, transparent 50%), radial-gradient(at 60% 92%, rgba(255,140,90,0.14) 0px, transparent 55%), #FFF8F2",
      },
      boxShadow: {
        oc: "0 24px 48px -18px rgba(201,62,32,0.28)",
        "oc-sm": "0 10px 24px -10px rgba(36,24,18,0.14)",
      },
      borderRadius: {
        "oc-xl": "44px",
        "oc-lg": "32px",
        oc: "22px",
        "oc-input": "16px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
