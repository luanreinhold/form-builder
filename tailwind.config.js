/** @type {import("tailwindcss").Config} */

/** Mapeia um token CSS (canais RGB) para uma cor Tailwind com suporte a opacidade. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** Token cujo valor dark ja carrega alpha proprio — nao aceita modificador /NN. */
const fixedToken = (name) => `rgb(var(--${name}))`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface: token("surface"),
        card: {
          DEFAULT: token("card"),
          hover: token("card-hover"),
        },
        popover: token("popover"),
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        foreground: token("foreground"),
        faint: token("faint"),
        edge: {
          DEFAULT: token("edge"),
          input: token("edge-input"),
          soft: token("edge-soft"),
          hover: token("edge-hover"),
        },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          foreground: token("primary-foreground"),
          active: token("primary-active"),
          surface: fixedToken("primary-surface"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          foreground: token("accent-foreground"),
          edge: token("accent-edge"),
        },
        ring: {
          DEFAULT: token("ring"),
          soft: fixedToken("ring-soft"),
        },
        danger: {
          DEFAULT: token("danger"),
          hover: token("danger-hover"),
          surface: {
            DEFAULT: fixedToken("danger-surface"),
            hover: fixedToken("danger-surface-hover"),
          },
          edge: token("danger-edge"),
          active: token("danger-active"),
          soft: fixedToken("danger-soft"),
        },
        success: {
          DEFAULT: token("success"),
          surface: fixedToken("success-surface"),
          edge: token("success-edge"),
        },
        warning: {
          DEFAULT: token("warning"),
          surface: fixedToken("warning-surface"),
          edge: token("warning-edge"),
        },
        info: {
          DEFAULT: token("info"),
          surface: fixedToken("info-surface"),
          edge: token("info-edge"),
        },
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(0.5rem) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "toast-in": "toast-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};
