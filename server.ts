import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Canonical Redirect Middleware
  app.use((req, res, next) => {
    const host = req.get("host") || "";
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    
    // 1. Redirect www to non-www
    if (host.startsWith("www.pixelresize.site")) {
      return res.redirect(301, `https://pixelresize.site${req.originalUrl}`);
    }

    // 2. Redirect HTTP to HTTPS for the canonical domain
    if (host === "pixelresize.site" && protocol === "http") {
      return res.redirect(301, `https://pixelresize.site${req.originalUrl}`);
    }

    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
