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
    app.use(express.static(distPath, { extensions: ["html"] }));
    
    // Specific routes for cleaner URLs if needed, or let static handle it
    app.get("/about", (req, res) => res.sendFile(path.join(distPath, "about.html")));
    app.get("/privacy", (req, res) => res.sendFile(path.join(distPath, "privacy.html")));
    app.get("/terms", (req, res) => res.sendFile(path.join(distPath, "terms.html")));
    app.get("/contact", (req, res) => res.sendFile(path.join(distPath, "contact.html")));
    app.get("/tools/gif-to-webp", (req, res) => res.sendFile(path.join(distPath, "tools/gif-to-webp/index.html")));
    app.get("/blog/how-to-resize-images-online", (req, res) => res.sendFile(path.join(distPath, "blog/how-to-resize-images-online/index.html")));
    app.get("/blog/best-image-format-for-websites", (req, res) => res.sendFile(path.join(distPath, "blog/best-image-format-for-websites/index.html")));
    app.get("/blog/seo-image-optimization-guide", (req, res) => res.sendFile(path.join(distPath, "blog/seo-image-optimization-guide/index.html")));
    app.get("/blog/best-image-formats-for-animated-content", (req, res) => res.sendFile(path.join(distPath, "blog/best-image-formats-for-animated-content/index.html")));
    app.get("/tools/heic-to-jpg", (req, res) => res.sendFile(path.join(distPath, "heic-to-jpg/index.html")));
    app.get("/heic-to-jpg", (req, res) => res.redirect(301, "/tools/heic-to-jpg"));
    app.get("/resize-passport-photo", (req, res) => res.sendFile(path.join(distPath, "resize-passport-photo/index.html")));
    app.get("/compress-image-for-whatsapp", (req, res) => res.sendFile(path.join(distPath, "compress-image-for-whatsapp/index.html")));
    app.get("/discord-pfp-resizer", (req, res) => res.sendFile(path.join(distPath, "discord-pfp-resizer/index.html")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
