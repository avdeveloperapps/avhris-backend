const reportLanMonitor = ({ level, kind, message, stacktrace, requestPath, context = {} }) => {
  const endpoint = process.env.LANMONITOR_URL;
  const key = process.env.LANMONITOR_KEY;
  if (!endpoint || !key || typeof fetch !== "function") return;

  const payload = {
    service: "avhris-node-api",
    environment: process.env.NODE_ENV || "production",
    level,
    kind,
    message: String(message || "Unknown error").slice(0, 16000),
    stacktrace: stacktrace ? String(stacktrace).slice(0, 16000) : undefined,
    request_path: requestPath,
    context,
  };

  // Do not await this call inside a customer request.
  setImmediate(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Lanmonitor-Key": key },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .catch(() => undefined)
      .finally(() => clearTimeout(timeout));
  });
};

module.exports = { reportLanMonitor };
