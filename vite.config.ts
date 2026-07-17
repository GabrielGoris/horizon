import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import catalogProxyHandler from "./api/catalog-proxy";
import steamCallbackHandler from "./server/steamRoutes/steam-callback";
import steamConnectHandler from "./server/steamRoutes/steam-connect";
import steamEnrichHandler from "./server/steamRoutes/steam-enrich";
import steamLibraryHandler from "./server/steamRoutes/steam-library";

function createApiPlugin(): Plugin {
  return {
    name: "horizon-api",
    configureServer(server) {
      server.middlewares.use("/api/catalog-proxy", (req, res) => {
        void catalogProxyHandler(req, res);
      });
      server.middlewares.use("/api/steam-connect", (req, res) => {
        void steamConnectHandler(req, res);
      });
      server.middlewares.use("/api/steam-callback", (req, res) => {
        void steamCallbackHandler(req, res);
      });
      server.middlewares.use("/api/steam-enrich", (req, res) => {
        void steamEnrichHandler(req, res);
      });
      server.middlewares.use("/api/steam-library", (req, res) => {
        void steamLibraryHandler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), createApiPlugin()],
});
