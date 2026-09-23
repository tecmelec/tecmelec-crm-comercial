import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { navy: { DEFAULT: "#1F3864", light: "#D9E1F2" } } } },
  plugins: [],
};
export default config;
