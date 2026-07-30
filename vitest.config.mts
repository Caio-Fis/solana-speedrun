import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Os hooks tocam sessionStorage e renderizam React; funções puras rodam
    // igual nos dois ambientes, então jsdom serve para tudo.
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
