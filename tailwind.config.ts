// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx,html}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
