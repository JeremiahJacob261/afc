/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: {
          950: "#06101F",
          900: "#091B34",
          850: "#0B1D3A",
          800: "#10284D",
        },
        electric: {
          400: "#23B5FF",
          500: "#1BB6FF",
          600: "#1294D4",
        },
        brick: {
          500: "#D14B45",
          600: "#C2413B",
        },
      },
      boxShadow: {
        glow: "0 0 34px rgba(35, 181, 255, 0.24)",
        "soft-xl": "0 28px 80px rgba(6, 16, 31, 0.12)",
      },
      backgroundImage: {
        "premium-radial":
          "radial-gradient(circle at 20% 20%, rgba(35,181,255,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(209,75,69,0.12), transparent 24%), linear-gradient(135deg, #091B34 0%, #06101F 100%)",
        "ice-grid":
          "linear-gradient(rgba(9,27,52,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(9,27,52,0.06) 1px, transparent 1px)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        draw: {
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 3.6s ease-in-out infinite",
        draw: "draw 2.8s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}