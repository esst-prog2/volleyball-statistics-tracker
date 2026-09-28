"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { CevImportError, parseCevHtml, validateCevUrl } = require("./src/cev.js");

const ROOT = path.resolve(__dirname);
const HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
const MAX_REQUEST_BYTES = 8 * 1024;
const MAX_CEV_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readRequestBody(request, limit = MAX_REQUEST_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new CevImportError("request_too_large", "The import request is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readLimitedResponse(response, limit, controller) {
  const stated = Number(response.headers.get("content-length"));
  if (Number.isFinite(stated) && stated > limit) {
    controller.abort();
    throw new CevImportError("page_too_large", "The CEV page is too large to import safely.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      controller.abort();
      throw new CevImportError("page_too_large", "The CEV page is too large to import safely.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

async function importCevPage(value, options = {}) {
  const sourceUrl = validateCevUrl(value);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_CEV_BYTES;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  try {
    const upstream = await fetchImpl(sourceUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "VolleyballStatisticsTracker/1.0 (+local educational project)" },
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      throw new CevImportError("redirect_rejected", "CEV redirected this page; the importer did not follow it.");
    }
    if (!upstream.ok) throw new CevImportError("cev_unavailable", `CEV returned HTTP ${upstream.status}.`);
    const html = await readLimitedResponse(upstream, maxBytes, controller);
    return parseCevHtml(html, sourceUrl);
  } catch (error) {
    if (error instanceof CevImportError) throw error;
    if (controller.signal.aborted) throw new CevImportError("cev_timeout", "CEV did not respond before the import timed out.");
    throw new CevImportError("cev_unavailable", "Could not retrieve the CEV page.");
  } finally {
    clearTimeout(timeout);
  }
}

function safeStaticPath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  const segments = decoded.split("/").filter(Boolean);
  if (decoded.includes("\0") || segments.some((segment) => segment === ".." || segment.startsWith("."))) return null;
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, relative);
  return resolved === ROOT || resolved.startsWith(`${ROOT}${path.sep}`) ? resolved : null;
}

function createAppServer(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${HOST}`);
    if (request.method === "POST" && requestUrl.pathname === "/api/cev-import") {
      try {
        const raw = await readRequestBody(request);
        let body;
        try { body = JSON.parse(raw); } catch { throw new CevImportError("invalid_request", "Send a JSON object containing a CEV URL."); }
        if (!body || typeof body.url !== "string") throw new CevImportError("invalid_request", "A CEV URL is required.");
        const match = await importCevPage(body.url, { fetchImpl, timeoutMs: options.timeoutMs, maxBytes: options.maxBytes });
        sendJson(response, 200, { match });
      } catch (error) {
        const known = error instanceof CevImportError;
        const status = error.code === "request_too_large" ? 413 : known ? 422 : 500;
        sendJson(response, status, { error: { code: known ? error.code : "internal_error", message: known ? error.message : "The import failed unexpectedly." } });
      }
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD, POST" });
      response.end();
      return;
    }
    const filePath = safeStaticPath(requestUrl.pathname);
    if (!filePath) { response.writeHead(404); response.end("Not found"); return; }
    try {
      const contents = await fs.readFile(filePath);
      response.writeHead(200, {
        "content-type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "x-content-type-options": "nosniff",
        "cache-control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : contents);
    } catch (error) {
      response.writeHead(error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 500);
      response.end(error.code === "ENOENT" || error.code === "EISDIR" ? "Not found" : "Server error");
    }
  });
}

if (require.main === module) {
  const requestedPort = Number(process.env.PORT || DEFAULT_PORT);
  const server = createAppServer();
  server.listen(requestedPort, HOST, () => {
    const address = server.address();
    console.log(`Volleyball Statistics Tracker: http://${HOST}:${address.port}`);
  });
}

module.exports = { HOST, MAX_CEV_BYTES, createAppServer, importCevPage, safeStaticPath };
