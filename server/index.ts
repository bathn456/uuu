import express from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 10000 }));

(async () => {
  await registerRoutes(app);
  serveStatic(app);
})();

// ❗ Vercel için burada listen() yok
export default app;
