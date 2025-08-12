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

// For Replit deployment - add proper server listening
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// ❗ Vercel için burada listen() yok
export default app;
