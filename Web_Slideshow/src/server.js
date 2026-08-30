const fs = require("fs");
const path = require("path");
const express = require("express");
const sharp = require("sharp");

const app = express();
const port = Number.parseInt(process.env.PORT || "8080", 10);
const photoDir = path.resolve(process.env.PHOTO_DIR || "/data/photos");
const slideshowIntervalSeconds = Number.parseInt(process.env.SLIDESHOW_INTERVAL_SECONDS || "8", 10);
const slideshowTitle = process.env.SLIDESHOW_TITLE || "Wedding Slideshow";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"]);
const browserNativeExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

function listImages(directory, relativeDirectory = "") {
  const absoluteDirectory = path.join(directory, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      return listImages(directory, relativePath);
    }

    const lowerName = entry.name.toLowerCase();
    const ignored = lowerName.endsWith(".partial") || lowerName.endsWith(".uploading");
    if (!entry.isFile() || ignored || !imageExtensions.has(path.extname(lowerName))) {
      return [];
    }

    const stats = fs.statSync(path.join(directory, relativePath));
    return [{
      id: Buffer.from(relativePath).toString("base64url"),
      name: entry.name,
      modifiedAt: stats.mtime.toISOString(),
    }];
  });
}

function resolvePhoto(id) {
  let relativePath;
  try {
    relativePath = Buffer.from(id, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const absolutePath = path.resolve(photoDir, relativePath);
  if (!absolutePath.startsWith(`${photoDir}${path.sep}`) || !fs.existsSync(absolutePath)) {
    return null;
  }

  return absolutePath;
}

fs.mkdirSync(photoDir, { recursive: true });
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/config", (_request, response) => {
  response.set("Cache-Control", "no-store");
  response.json({ intervalSeconds: slideshowIntervalSeconds, title: slideshowTitle });
});

app.get("/api/photos", (_request, response) => {
  const photos = listImages(photoDir);
  response.json({ photos });
});

app.get("/api/photos/:id", async (request, response, next) => {
  const photoPath = resolvePhoto(request.params.id);
  if (!photoPath || !imageExtensions.has(path.extname(photoPath).toLowerCase())) {
    response.status(404).json({ message: "Photo not found." });
    return;
  }

  try {
    const extension = path.extname(photoPath).toLowerCase();
    response.set("Cache-Control", "public, max-age=86400");
    if (browserNativeExtensions.has(extension)) {
      response.sendFile(photoPath);
      return;
    }

    response.type("jpeg");
    sharp(photoPath).rotate().jpeg({ quality: 90 }).pipe(response);
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "The photo could not be displayed." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Wedding web slideshow listening on port ${port}.`);
});