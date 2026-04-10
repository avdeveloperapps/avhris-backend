const multer = require("multer");
const path = require("path");

const defaultAllowedMimeTypes = new Set([
  "image/png",
  "image/jpg",
  "image/jpeg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function buildUploadedFilename(originalname = "file") {
  const extension = path.extname(originalname);
  const baseName = path
    .basename(originalname, extension)
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return `${baseName || "file"}-${Date.now()}${extension.toLowerCase()}`;
}

function defaultFileFilter(req, file, cb) {
  if (defaultAllowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error("Cannot upload file"), false);
}

function createMemoryUpload({
  fileFilter = defaultFileFilter,
  maxFileSize = 4000000,
  beforeFilter,
} = {}) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (typeof beforeFilter === "function") {
        beforeFilter(req, file);
      }
      return fileFilter(req, file, cb);
    },
    limits: { fileSize: maxFileSize },
  });
}

module.exports = {
  buildUploadedFilename,
  createMemoryUpload,
  defaultFileFilter,
};
