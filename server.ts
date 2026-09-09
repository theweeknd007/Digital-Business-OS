import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import apiApp from "./artifacts/api-server/src/app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();

  // 1. Mount API server routes (handles /api/*)
  app.use(apiApp);

  // 2. Frontend integration
  const frontendDir = path.resolve(__dirname, "artifacts/goat-pay");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: frontendDir,
      configFile: path.resolve(frontendDir, "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(frontendDir, "dist/public");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GOAT-PAY] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[GOAT-PAY] Failed to start server:", err);
  process.exit(1);
});
