import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        background: "#fbf9f6",
        "surface-low": "#f5f3f0",
        surface: "#ffffff",
        "surface-high": "#eeece9",
        primary: "#012d1d",
        "primary-container": "#1b4332",
        amber: "#d4a843",
        "amber-dim": "#eec058",
        "amber-text": "#5b4300",
        "text-primary": "#1b1c1a",
        "text-body": "#4b5563",
        "text-muted": "#717973",
        whatsapp: "#25d366",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        input: "6px",
        badge: "4px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(27, 28, 26, 0.06)",
        float: "0 8px 40px rgba(27, 28, 26, 0.10)",
      },
    },
  },
};

export default config;
