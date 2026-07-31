import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// O Vitest só define NODE_ENV=test quando a variável está vazia. Num ambiente
// que já a define como "production" — o build do Vercel, por exemplo — o Vite
// resolve o build de produção do React, onde `React.act` não existe, e todo
// teste de hook quebra. Rodar a suíte é, por definição, NODE_ENV=test.
// O cast é necessário porque os tipos do Next declaram NODE_ENV readonly.
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

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
