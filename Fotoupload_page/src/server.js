const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const express = require("express");
const multer = require("multer");

const app = express();

const port = Number.parseInt(process.env.PORT || "8080", 10);
const uploadDirectory = process.env.UPLOAD_DIR || "/data/uploads";
const maxFileSizeMb = Number.parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
const maxFilesPerRequest = Number.parseInt(process.env.MAX_FILES_PER_REQUEST || "25", 10);
const slideshowTitle = process.env.SLIDESHOW_TITLE || "Wedding Slideshow";
const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif"
]);

fs.mkdirSync(uploadDirectory, { recursive: true });

function sanitizeName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  const safeBaseName = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${safeBaseName || "foto"}${extension}`;
}

function createStoredFileName(originalName) {
  const safeName = sanitizeName(originalName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomId = crypto.randomUUID();

  return `${timestamp}-${randomId}-${safeName}`;
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_request, file, callback) => {
    callback(null, `${createStoredFileName(file.originalname)}.uploading`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: maxFilesPerRequest
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const looksLikeImage = file.mimetype.startsWith("image/") || allowedExtensions.has(extension);

    if (!allowedExtensions.has(extension) || !looksLikeImage) {
      callback(new Error("Please upload image files only."));
      return;
    }

    callback(null, true);
  }
}).array("photos", maxFilesPerRequest);

app.disable("x-powered-by");

app.use(express.static(path.join(__dirname, "..", "public"), {
  extensions: ["html"],
  maxAge: "1h"
}));

app.get("/healthz", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/api/config", (_request, response) => {
  response.set("Cache-Control", "no-store");
  response.json({ title: slideshowTitle });
});

app.post("/api/upload", (request, response) => {
  upload(request, response, async (error) => {
    if (error) {
      const statusCode = error instanceof multer.MulterError ? 413 : 400;
      response.status(statusCode).json({ message: error.message });
      return;
    }

    const files = request.files || [];

    if (files.length === 0) {
      response.status(400).json({ message: "Please select at least one photo." });
      return;
    }

    const storedFiles = [];

    try {
      for (const file of files) {
        const finalPath = file.path.replace(/\.uploading$/, "");
        await fs.promises.rename(file.path, finalPath);
        storedFiles.push(path.basename(finalPath));
      }

      response.status(201).json({
        count: storedFiles.length,
        files: storedFiles,
        message: "Thank you, your photos have arrived."
      });
    } catch (_renameError) {
      await Promise.allSettled(files.map((file) => fs.promises.rm(file.path, { force: true })));
      response.status(500).json({ message: "The upload could not be completed." });
    }
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Not found." });
});

app.listen(port, () => {
  console.log(`Wedding photo upload is listening on port ${port}`);
  console.log(`Uploads are stored in ${uploadDirectory}`);
});
