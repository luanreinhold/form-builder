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
        success: token("success"),
      },
    },
  },
  plugins: [],
};
