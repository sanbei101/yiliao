import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,
  sortTailwindcss: {
    functions: ["clsx", "cn"],
    stylesheet: "src/style.css",
  },
  ignorePatterns: ["src/components/ui", "backend"],
});
