// server/index.ts
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 10000 }));

(async () => {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    // Use Vite dev server in development
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    // Serve static files in production
    const { serveStatic } = await import("./vite.js");
    serveStatic(app);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  if (process.env.NODE_ENV !== "production") {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
})();

export default app;
