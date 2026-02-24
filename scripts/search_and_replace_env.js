#!/usr/bin/env node
/**
 * Runtime script: runs inside the container when real env vars are available (e.g. from AWS).
 * Replaces placeholder strings (md5 of env key) in .next/**/*.js with actual process.env values.
 * Run before starting the server (see build_and_run.sh).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const appDir = process.env.APP_DIR || "/app";
const envExamplePath = path.join(appDir, ".env.example");
const nextDir = path.join(appDir, ".next");

function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

function getKeysFromExample() {
  if (!fs.existsSync(envExamplePath)) {
    console.warn("search_and_replace_env: .env.example not found, skipping");
    return [];
  }
  const content = fs.readFileSync(envExamplePath, "utf8");
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("#") && trimmed.includes("=");
    })
    .map((line) => line.slice(0, line.indexOf("=")).trim());
}

function collectJsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectJsFiles(full, files);
    } else if (e.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

const keys = getKeysFromExample();
if (keys.length === 0) {
  console.log("search_and_replace_env: no keys to replace");
  process.exit(0);
}

const replacements = new Map();
for (const key of keys) {
  const placeholder = md5(key);
  const value = process.env[key];
  if (value !== undefined && value !== "") {
    replacements.set(placeholder, value);
  }
}

if (replacements.size === 0) {
  console.log("search_and_replace_env: no env values set, skipping replace");
  process.exit(0);
}

const jsFiles = collectJsFiles(nextDir);
let totalReplaced = 0;
for (const file of jsFiles) {
  let data = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [placeholder, value] of replacements) {
    const count = (data.match(new RegExp(escapeRe(placeholder), "g")) || []).length;
    if (count > 0) {
      data = data.split(placeholder).join(value);
      changed = true;
      totalReplaced += count;
    }
  }
  if (changed) {
    fs.writeFileSync(file, data, "utf8");
  }
}

console.log("search_and_replace_env: replaced", totalReplaced, "placeholder(s) in", jsFiles.length, "file(s)");

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
