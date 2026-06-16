import { lingui } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    babel({
      plugins: ["@lingui/babel-plugin-lingui-macro"],
    }),
    react(),
    tailwindcss(),
    lingui(),
  ],
  test: {
    environment: "jsdom",
  },
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts", "src/locales/**"],
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts", "src/locales/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
