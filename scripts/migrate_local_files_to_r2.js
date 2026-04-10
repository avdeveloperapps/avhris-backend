#!/usr/bin/env node

require("dotenv").config();

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  buildObjectKey,
  getPublicUrl,
  isR2Configured,
  uploadLocalFile,
} = require("../utils/r2");

const projectRoot = path.resolve(__dirname, "..");
const logDirectory = path.join(projectRoot, "logs");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(logDirectory, `r2-migration-${timestamp}.jsonl`);
const migrationSource = process.env.R2_MIGRATION_SOURCE || "local";
const flyAppName = process.env.FLY_APP_NAME || "avhris-backend-new";
const flyPublicPath = process.env.FLY_PUBLIC_PATH || "/app/public";
const progressIntervalMs = parseInt(
  process.env.R2_MIGRATION_PROGRESS_INTERVAL_MS || "5000",
  10
);

function getTargets(sourceRoot) {
  return [
    {
      folder: "uploads",
      localDirectory: path.join(sourceRoot, "uploads"),
    },
    {
      folder: "files",
      localDirectory: path.join(sourceRoot, "files"),
    },
  ];
}

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

function printProgress(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stderr = "";

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stderr });
      } else {
        reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
      }
    });
  });
}

async function uploadWithAwsCli({ localPath, objectKey }) {
  await uploadLocalFile({
    folder: objectKey.startsWith(`${process.env.CLOUDFLARE_R2_DIRECTORY || "avhris"}/files/`)
      ? "files"
      : "uploads",
    localPath,
    fileName: objectKey.replace(
      `${process.env.CLOUDFLARE_R2_DIRECTORY || "avhris"}/`,
      ""
    ).replace(/^(uploads|files)\//, ""),
  });
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function runFlyDirectMigration() {
  const workerScriptPath = path.join(__dirname, "fly_r2_migration_worker.js");
  const workerScript = await fs.promises.readFile(workerScriptPath, "utf8");
  const workerBase64 = Buffer.from(workerScript, "utf8").toString("base64");
  const remoteEnv = [
    `CLOUDFLARE_R2_ACCOUNT_ID=${shellEscape(process.env.CLOUDFLARE_R2_ACCOUNT_ID || "")}`,
    `CLOUDFLARE_R2_ACCESS_KEY_ID=${shellEscape(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "")}`,
    `CLOUDFLARE_R2_SECRET_ACCESS_KEY=${shellEscape(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "")}`,
    `CLOUDFLARE_R2_BUCKET=${shellEscape(process.env.CLOUDFLARE_R2_BUCKET || "")}`,
    `CLOUDFLARE_R2_ENDPOINT=${shellEscape(process.env.CLOUDFLARE_R2_ENDPOINT || "")}`,
    `CLOUDFLARE_R2_PUBLIC_BASE_URL=${shellEscape(process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "")}`,
    `CLOUDFLARE_R2_DIRECTORY=${shellEscape(process.env.CLOUDFLARE_R2_DIRECTORY || "avhris")}`,
    `FLY_PUBLIC_PATH=${shellEscape(flyPublicPath)}`,
  ].join(" ");
  const workerEval = `eval(Buffer.from('${workerBase64}','base64').toString('utf8'))`;
  const remoteCommand = `sh -lc ${shellEscape(
    `${remoteEnv} node -e "${workerEval}"`
  )}`;

  await appendLog({
    status: "info",
    source: "fly-direct",
    fly_app: flyAppName,
    fly_public_path: flyPublicPath,
    logged_at: new Date().toISOString(),
  });
  printProgress(
    `Starting direct migration on Fly app=${flyAppName} path=${flyPublicPath}`
  );

  await new Promise((resolve, reject) => {
    const flyctl = spawn(
      "flyctl",
      [
        "ssh",
        "console",
        "-a",
        flyAppName,
        "--pty=false",
        "--quiet",
        "-C",
        remoteCommand,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    flyctl.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    flyctl.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    flyctl.on("error", reject);
    flyctl.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `fly direct migration exited with code ${code}`));
        return;
      }

      const summaryLine = stdout
        .split("\n")
        .find((line) => line.startsWith("__SUMMARY__"));
      if (!summaryLine) {
        reject(new Error("direct fly migration finished without summary output"));
        return;
      }

      const summary = JSON.parse(summaryLine.replace("__SUMMARY__", ""));
      await appendLog({
        status: "success",
        source: "fly-direct",
        summary,
        logged_at: new Date().toISOString(),
      });
      console.log(`Migration log: ${logFile}`);
      console.log(
        JSON.stringify(
          {
            summary,
            source: "fly-direct",
            fly_app: flyAppName,
            fly_public_path: flyPublicPath,
            public_base_url: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL,
            directory: process.env.CLOUDFLARE_R2_DIRECTORY || "avhris",
          },
          null,
          2
        )
      );
      resolve();
    });
  });
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
  printProgress(
    `Starting upload for folder=${target.folder} with ${result.total} files from ${target.localDirectory}`
  );

  for (let index = 0; index < files.length; index += 1) {
    const localPath = files[index];
    const relativePath = path.relative(target.localDirectory, localPath);
    const normalizedRelativePath = relativePath.split(path.sep).join("/");
    const objectKey = buildObjectKey(target.folder, normalizedRelativePath);
    const publicUrl = getPublicUrl(target.folder, normalizedRelativePath);

    try {
      await uploadWithAwsCli({ localPath, objectKey });
      result.success += 1;
      if (result.success === 1 || (index + 1) % 25 === 0 || index + 1 === files.length) {
        printProgress(
          `Uploaded ${index + 1}/${files.length} files from folder=${target.folder}`
        );
      }
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
      const failureMessage = `Upload failed for folder=${target.folder} file=${normalizedRelativePath}: ${error.message}`;
      console.error(failureMessage);
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
      throw new Error(failureMessage);
    }
  }

  printProgress(
    `Completed folder=${target.folder}: success=${result.success}, failed=${result.failed}`
  );
  return result;
}

async function main() {
  if (!isR2Configured()) {
    throw new Error(
      "Cloudflare R2 belum terkonfigurasi. Lengkapi env R2 sebelum migrasi."
    );
  }

  await ensureDirectory(logDirectory);
  if (migrationSource === "fly") {
    await runCommand("aws", ["--version"]);
  }
  printProgress(`Migration started with source=${migrationSource}`);
  if (migrationSource === "fly") {
    await runFlyDirectMigration();
    return;
  }

  const sourceRoot = path.join(projectRoot, "public");
  const targets = getTargets(sourceRoot);

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
        source: migrationSource,
        source_root: sourceRoot,
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
  console.error(`Migration failed: ${error.message}`);
  console.error(`Migration log: ${logFile}`);
  process.exit(1);
});
