import type { Config } from "tailwindcss";

export default {
  // lib/ is included because campaignVisuals.ts builds Tailwind gradient class names
  // (from-*/to-*) as data outside app/ or components/ — without this, Tailwind's content
  // scanner never sees those tokens and silently omits them from the generated CSS.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OpenCollab.id "NFT-style redesign" palette — from the design handoff spec
        // (claude.ai/design project 81a9ff59 — "OpenCollab NFT-Style Redesign.dc.html").
        // Single coral accent (purple oc-600 retired), ink for dark surfaces/secondary CTAs,
        // flat solid pastel fills for cards (no gradients). The pre-existing KOL Finder /
        // Business Leads areas keep using stock Tailwind slate/indigo and are untouched.
        oc: {
          900: "#7A2C1A",
          700: "#E85F3D",
          600: "#FF7A59",
          500: "#FF9478",
          400: "#FFB39D",
          300: "#FFD4C7",
          bg: "#FFF8F0",
          card: "#FFFFFF",
          dark: "#23262B",
          "dark-muted": "#B7B2A4",
          ink: "#23262B",
          "ink-muted": "#5B5648",
          subtle: "#8A8578",
          teal: "#2FBFB5",
          border: "#EDE3D2",
        },
        // The 7 flat pastel fills cards rotate through — never more than one per row repeats.
        tile: {
          blush: "#FFC9C9",
          lime: "#E4F26B",
          mustard: "#FFC857",
          lavender: "#C9B6F5",
          sky: "#A0E7E5",
          green: "#B6E5A0",
          salmon: "#FFB4A2",
        },
        // Section-wrapper background tints (swap per-section on top of the cream base).
        tint: {
          cream: "#FFF8F0",
          lavender: "#FBF1FF",
          sky: "#F0FAFA",
          peach: "#FFF3E9",
        },
      },
      boxShadow: {
        oc: "0 20px 40px -6px rgba(35,38,43,0.15)",
        "oc-sm": "0 8px 24px -8px rgba(35,38,43,0.08)",
      },
      borderRadius: {
        "oc-xl": "40px",
        "oc-lg": "36px",
        oc: "28px",
        "oc-input": "20px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
