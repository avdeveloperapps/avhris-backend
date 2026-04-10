const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SIGNING_ALGORITHM = "AWS4-HMAC-SHA256";
const SIGNING_SERVICE = "s3";
const SIGNING_REGION = "auto";

function printProgress(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

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

function buildObjectKey(folder, storedName) {
  return [
    trimSlashes(process.env.CLOUDFLARE_R2_DIRECTORY || "avhris"),
    normalizePathPart(folder),
    normalizePathPart(storedName),
  ]
    .filter(Boolean)
    .join("/");
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

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSHA256(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function deriveSigningKey(secretAccessKey, dateStamp) {
  const dateKey = hmacSHA256(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmacSHA256(dateKey, SIGNING_REGION);
  const serviceKey = hmacSHA256(regionKey, SIGNING_SERVICE);
  return hmacSHA256(serviceKey, "aws4_request");
}

function escapePathSegment(segment) {
  return encodeURIComponent(segment)
    .replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/\+/g, "%20");
}

function joinUrlPath(basePath, bucket, objectKey) {
  const parts = [String(basePath || "").replace(/\/+$/, ""), escapePathSegment(bucket)];
  for (const segment of String(objectKey || "").split("/")) {
    if (!segment) continue;
    parts.push(escapePathSegment(segment));
  }
  let joined = parts.join("/");
  if (!joined.startsWith("/")) joined = `/${joined}`;
  return joined;
}

function buildAmzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return iso.slice(0, 15) + "Z";
}

async function signedPutObject(objectKey, body, contentType) {
  const endpoint = new URL(
    process.env.CLOUDFLARE_R2_ENDPOINT ||
      `https://${getRequiredEnv("CLOUDFLARE_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`
  );
  const bucketName = getRequiredEnv("CLOUDFLARE_R2_BUCKET");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const payloadHash = sha256Hex(body);
  const amzDate = buildAmzDate(new Date());
  const dateStamp = amzDate.slice(0, 8);
  const requestPath = joinUrlPath(endpoint.pathname, bucketName, objectKey);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${endpoint.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    requestPath,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = [
    dateStamp,
    SIGNING_REGION,
    SIGNING_SERVICE,
    "aws4_request",
  ].join("/");
  const stringToSign = [
    SIGNING_ALGORITHM,
    amzDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest)),
  ].join("\n");
  const signature = hmacSHA256(
    deriveSigningKey(secretAccessKey, dateStamp),
    stringToSign
  ).toString("hex");
  const authorization = `${SIGNING_ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(new URL(requestPath, endpoint).toString(), {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
    },
    body,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `R2 PUT failed: status=${response.status} body=${responseBody.trim()}`
    );
  }
}

async function getFilesRecursively(directoryPath) {
  const entries = await fs.promises.readdir(directoryPath, {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function uploadFolder(baseRoot, folder) {
  const targetRoot = path.join(baseRoot, folder);
  if (!fs.existsSync(targetRoot)) {
    printProgress(`Skipping folder=${folder}, source not found`);
    return { total: 0, success: 0, failed: 0 };
  }

  const files = await getFilesRecursively(targetRoot);
  printProgress(`Starting direct Fly upload for folder=${folder}, files=${files.length}`);

  let success = 0;
  for (let index = 0; index < files.length; index += 1) {
    const localPath = files[index];
    const relativePath = path.relative(targetRoot, localPath).split(path.sep).join("/");
    const objectKey = buildObjectKey(folder, relativePath);
    try {
      const body = await fs.promises.readFile(localPath);
      await signedPutObject(objectKey, body, detectContentType(relativePath));
      success += 1;
      if (success === 1 || (index + 1) % 25 === 0 || index + 1 === files.length) {
        printProgress(`Uploaded ${index + 1}/${files.length} files for folder=${folder}`);
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Upload failed for folder=${folder} file=${relativePath}: ${error.message}`
      );
      process.exit(1);
    }
  }

  return { total: files.length, success, failed: 0 };
}

(async () => {
  const sourceRoot = process.env.FLY_PUBLIC_PATH || "/app/public";
  printProgress(`Direct migration on Fly started from ${sourceRoot}`);
  const uploadSummary = await uploadFolder(sourceRoot, "uploads");
  const fileSummary = await uploadFolder(sourceRoot, "files");
  const summary = {
    total: uploadSummary.total + fileSummary.total,
    success: uploadSummary.success + fileSummary.success,
    failed: 0,
  };
  printProgress(`Direct migration finished: ${JSON.stringify(summary)}`);
  console.log(`__SUMMARY__${JSON.stringify(summary)}`);
})().catch((error) => {
  console.error(`[${new Date().toISOString()}] Migration failed: ${error.message}`);
  process.exit(1);
});
