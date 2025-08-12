// server/index.ts
import path from "path";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 10000 }));

(async () => {
  await registerRoutes(app);

  // STATIC dosyalar
  const publicPath = path.join(__dirname, "../dist/public");
  app.use(express.static(publicPath));

  // React Router fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
})();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
