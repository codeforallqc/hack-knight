/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {

      // COLORS
      colors: {
        void: "#0a0a0f",           // page background
        surface: "#12121a",        // cards, panels, navbar
        border: "#1e1e2e",         // subtle borders and dividers
        ultraviolet: "#7c3aed",    // primary accent / CTA
        violet: {
          light: "#a78bfa",        // hover state for primary
          dark: "#5b21b6",         // pressed/active state
        },
        text: {
          primary: "#f4f4f5",      // headings and important text
          secondary: "#a1a1aa",    // body copy, descriptions
          muted: "#52525b",        // placeholders, disabled
        },
        sponsor: {
          gold: "#f59e0b",         // Gold tier sponsor badge
          silver: "#94a3b8",       // Silver tier sponsor badge
          bronze: "#b45309",       // Bronze tier sponsor badge
        },
      },

      // TYPOGRAPHY
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],     // H1, H2, logo, timer
        body: ["Lexend", "sans-serif"],               // paragraphs, labels, nav
        mono: ["JetBrains Mono", "monospace"],       // countdown digits, code
      },
      fontSize: {
        hero:    ["4.5rem",  { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        card:    ["1.125rem",{ lineHeight: "1.6" }],
      },

      // SPACING
      spacing: {
        section:   "6rem",   // vertical padding between page sections
        container: "1.5rem", // horizontal page gutters
      },

      // BORDER RADIUS
      borderRadius: {
        card: "1rem",     // cards, panels
        pill: "9999px",   // buttons, badges
      },

      // SHADOWS
      boxShadow: {
        glow: "0 0 20px rgba(124, 58, 237, 0.4)",  // ultraviolet glow on CTAs
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",     // card elevation
      },

      // EASING
      transitionTimingFunction: {
        brand: "cubic-bezier(0.4, 0, 0.2, 1)", // use on all transitions
      },

      // ANIMATIONS
      animation: {
        marquee:     "marquee 30s linear infinite",           // sponsor carousel
        pulseGlow:   "pulseGlow 2s ease-in-out infinite",    // CTA button glow
        fadeUp:      "fadeUp 0.6s ease forwards",            // scroll reveal
        fadeIn:      "fadeIn 0.4s ease forwards",            // general fade
      },
      keyframes: {
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px #7c3aed" },
          "50%":      { boxShadow: "0 0 28px #7c3aed, 0 0 60px #7c3aed55" },
        },
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
