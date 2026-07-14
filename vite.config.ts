import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import catalogProxyHandler from "./api/catalog-proxy";

function createCatalogProxyPlugin(): Plugin {
  return {
    name: "horizon-catalog-proxy",
    configureServer(server) {
      server.middlewares.use("/api/catalog-proxy", (req, res) => {
        void catalogProxyHandler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), createCatalogProxyPlugin()],
});
