/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {

      // COLORS
      colors: {
        void: "#1E1E24",           // page background
        surface: "#12121a",        // cards, panels, navbar
        border: "#71717A",         // subtle borders and dividers
        ultraviolet: "#A855F7",    // primary accent / CTA
        cyberTeal: "#2DD4BF",      // hacking / workshops accent
        signalYellow: "#FBBF24",   // food / logistics accent
        electricBlue: "#3B82F6",   // check-in / admin accent
        violet: {
          light: "#C084FC",        // hover state for primary
          dark: "#7C3AED",         // pressed/active state
        },
        text: {
          primary: "#f4f4f5",      // headings and important text
          secondary: "#a1a1aa",    // body copy, descriptions
          muted: "#52525b",        // placeholders, disabled
        },
      },

      // TYPOGRAPHY
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],     // H1, H2, logo, timer
        body: ["Lexend", "sans-serif"],               // paragraphs, labels, nav
        mono: ["JetBrains Mono", "monospace"],       // countdown digits, code
      },
      fontSize: {
        hero: ["7rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        card: ["1.125rem", { lineHeight: "1.6" }],
      },

      // SPACING
      spacing: {
        section: "6rem",   // vertical padding between page sections
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
        marquee: "marquee 30s linear infinite",           // sponsor carousel
        pulseGlow: "pulseGlow 2s ease-in-out infinite",    // CTA button glow
        fadeUp: "fadeUp 0.6s ease forwards",            // scroll reveal
        fadeIn: "fadeIn 0.4s ease forwards",            // general fade
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px #7c3aed" },
          "50%": { boxShadow: "0 0 28px #7c3aed, 0 0 60px #7c3aed55" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
