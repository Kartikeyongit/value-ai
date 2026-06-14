/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#020617",
        surface: "#0f172a",
        panel: "#1e293b",
        border: "#334155",
        accent: "#6366f1",
        "accent-hover": "#4f46e5",
        "text-primary": "#f8fafc",
        "text-secondary": "#94a3b8",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        glow: { "0%": { boxShadow: "0 0 5px rgba(99, 102, 241, 0.2)" }, "100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.6)" } },
      },
    },
  },
  plugins: [],
}