#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  buildObjectKey,
  detectContentType,
  getPublicUrl,
  isR2Configured,
  uploadLocalFile,
} = require("../utils/r2");

const projectRoot = path.resolve(__dirname, "..");
const logDirectory = path.join(projectRoot, "logs");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(logDirectory, `r2-migration-${timestamp}.jsonl`);

const targets = [
  {
    folder: "uploads",
    localDirectory: path.join(projectRoot, "public", "uploads"),
  },
  {
    folder: "files",
    localDirectory: path.join(projectRoot, "public", "files"),
  },
];

async function ensureDirectory(directoryPath) {
  await fs.promises.mkdir(directoryPath, { recursive: true });
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

async function appendLog(record) {
  await fs.promises.appendFile(logFile, `${JSON.stringify(record)}\n`);
}

async function migrateTarget(target) {
  const result = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  if (!fs.existsSync(target.localDirectory)) {
    result.skipped += 1;
    await appendLog({
      status: "skipped",
      folder: target.folder,
      local_directory: target.localDirectory,
      message: "directory not found",
      logged_at: new Date().toISOString(),
    });
    return result;
  }

  const files = await getFilesRecursively(target.localDirectory);
  result.total = files.length;

  for (const localPath of files) {
    const relativePath = path.relative(target.localDirectory, localPath);
    const normalizedRelativePath = relativePath.split(path.sep).join("/");
    const objectKey = buildObjectKey(target.folder, normalizedRelativePath);
    const publicUrl = getPublicUrl(target.folder, normalizedRelativePath);

    try {
      await uploadLocalFile({
        folder: target.folder,
        localPath,
        fileName: normalizedRelativePath,
        contentType: detectContentType(localPath),
      });
      result.success += 1;
      await appendLog({
        status: "success",
        folder: target.folder,
        local_path: localPath,
        relative_path: normalizedRelativePath,
        object_key: objectKey,
        public_url: publicUrl,
        logged_at: new Date().toISOString(),
      });
    } catch (error) {
      result.failed += 1;
      await appendLog({
        status: "failed",
        folder: target.folder,
        local_path: localPath,
        relative_path: normalizedRelativePath,
        object_key: objectKey,
        public_url: publicUrl,
        error: error.message,
        logged_at: new Date().toISOString(),
      });
    }
  }

  return result;
}

async function main() {
  if (!isR2Configured()) {
    throw new Error(
      "Cloudflare R2 belum terkonfigurasi. Lengkapi env R2 sebelum migrasi."
    );
  }

  await ensureDirectory(logDirectory);

  const summary = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  for (const target of targets) {
    const result = await migrateTarget(target);
    summary.total += result.total;
    summary.success += result.success;
    summary.failed += result.failed;
    summary.skipped += result.skipped;
  }

  console.log(`Migration log: ${logFile}`);
  console.log(
    JSON.stringify(
      {
        summary,
        public_base_url: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL,
        directory: process.env.CLOUDFLARE_R2_DIRECTORY || "avhris",
      },
      null,
      2
    )
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await ensureDirectory(logDirectory);
  await appendLog({
    status: "fatal",
    error: error.message,
    logged_at: new Date().toISOString(),
  });
  console.error(error.message);
  console.error(`Migration log: ${logFile}`);
  process.exit(1);
});
