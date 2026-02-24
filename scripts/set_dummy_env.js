#!/usr/bin/env node
/**
 * Build-time script: creates .env with placeholder values (md5 of each key).
 * Next.js build then bakes these placeholders into .next output.
 * At runtime, search_and_replace_env.js replaces them with real env vars (e.g. from AWS).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envExamplePath = path.join(__dirname, "..", ".env.example");
const envPath = path.join(__dirname, "..", ".env");

function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

const content = fs.readFileSync(envExamplePath, "utf8");
const lines = content.split("\n").filter((line) => {
  const trimmed = line.trim();
  return trimmed && !trimmed.startsWith("#") && trimmed.includes("=");
});

const dummyLines = lines.map((line) => {
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  const value = md5(key);
  return `${key}=${value}`;
});

fs.writeFileSync(envPath, dummyLines.join("\n") + "\n", "utf8");
console.log("set_dummy_env: wrote .env with", dummyLines.length, "placeholder(s)");
