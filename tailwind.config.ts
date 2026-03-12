import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/games/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary":   "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card":      "var(--bg-card)",
        "accent":       "var(--accent-primary)",
        "accent-2":     "var(--accent-secondary)",
        "tx-primary":   "var(--text-primary)",
        "tx-secondary": "var(--text-secondary)",
        "tx-muted":     "var(--text-muted)",
        "border-c":     "var(--border)",
        "gold":         "var(--gold)",
        "silver":       "var(--silver)",
        "bronze":       "var(--bronze)",
        "success":      "var(--success)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        glow:        "0 0 20px var(--accent-glow)",
        "glow-lg":   "0 0 30px var(--accent-glow-strong), 0 0 60px var(--accent-glow)",
        "glow-gold": "0 0 20px rgba(255, 215, 0, 0.4)",
      },
      animation: {
        "ticker":           "ticker-scroll 40s linear infinite",
        "challenge-pulse":  "challenge-pulse 2s ease-in-out infinite",
        "score-reveal":     "score-reveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "hero-pulse":       "hero-pulse 4s ease-in-out infinite",
        "stokemaster":      "stokemaster-shimmer 2s ease infinite",
        "live-pulse":       "live-pulse 1.5s ease-in-out infinite",
        "skeleton":         "skeleton-pulse 1.5s ease-in-out infinite",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse at center, rgba(255,61,0,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
