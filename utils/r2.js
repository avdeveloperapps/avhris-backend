require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require(
  "@aws-sdk/client-s3"
);

const DEFAULT_PUBLIC_BASE_URL = "https://storage.avgroup.my.id";
const DEFAULT_DIRECTORY = "avhris";

let cachedClient = null;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function trimSlashes(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function normalizePathPart(value = "") {
  return String(value)
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

function getR2Directory() {
  return trimSlashes(process.env.CLOUDFLARE_R2_DIRECTORY || DEFAULT_DIRECTORY);
}

function getPublicBaseUrl() {
  return (
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || DEFAULT_PUBLIC_BASE_URL
  ).replace(/\/+$/, "");
}

function isR2Configured() {
  return Boolean(
    process.env.CLOUDFLARE_R2_BUCKET &&
      process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  );
}

function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: process.env.CLOUDFLARE_R2_REGION || "auto",
    endpoint: getRequiredEnv("CLOUDFLARE_R2_ENDPOINT"),
    credentials: {
      accessKeyId: getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });

  return cachedClient;
}

function getBucketName() {
  return getRequiredEnv("CLOUDFLARE_R2_BUCKET");
}

function buildObjectKey(folder, storedName) {
  return [getR2Directory(), normalizePathPart(folder), normalizePathPart(storedName)]
    .filter(Boolean)
    .join("/");
}

function getPublicUrl(folder, storedName) {
  if (!storedName) {
    return null;
  }
  if (/^https?:\/\//i.test(storedName)) {
    return storedName;
  }
  const encodedPath = buildObjectKey(folder, storedName)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${getPublicBaseUrl()}/${encodedPath}`;
}

function detectContentType(fileName, fallback = "application/octet-stream") {
  const extension = path.extname(fileName || "").toLowerCase();
  const contentTypeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".json": "application/json",
  };

  return contentTypeMap[extension] || fallback;
}

async function uploadBuffer({ folder, fileName, buffer, contentType }) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: buildObjectKey(folder, fileName),
      Body: buffer,
      ContentType: detectContentType(fileName, contentType),
    })
  );

  return {
    fileName,
    objectKey: buildObjectKey(folder, fileName),
    url: getPublicUrl(folder, fileName),
  };
}

async function uploadLocalFile({ folder, localPath, fileName, contentType }) {
  const body = fs.createReadStream(localPath);
  return uploadBuffer({
    folder,
    fileName,
    buffer: body,
    contentType: detectContentType(fileName, contentType),
  });
}

async function deleteObject(folder, storedName) {
  if (!storedName || /^https?:\/\//i.test(storedName)) {
    return;
  }

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: buildObjectKey(folder, storedName),
    })
  );
}

module.exports = {
  buildObjectKey,
  deleteObject,
  detectContentType,
  getPublicBaseUrl,
  getPublicUrl,
  getR2Directory,
  isR2Configured,
  uploadBuffer,
  uploadLocalFile,
};
