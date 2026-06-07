#!/usr/bin/env node
// One-time backfill: generate and upload .seb config files for all published exams.
// Usage: node backfill-seb.js
// Requires Node 18+ (native fetch).

const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);

const SUPABASE_URL = process.env.SUPABASE_URL || "https://toxgihdyfzdymgidgvaq.supabase.co";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required.");
  process.exit(1);
}

const BUCKET = "seb-configs";

const authHeaders = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

function generateSebConfig(shareId) {
  const examUrl = `https://exam.test-flo.com/exam-engine.html?id=${shareId}&amp;group=&amp;seb=1`;
  // Array join guarantees \n line endings and no BOM
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>startURL</key>',
    `  <string>${examUrl}</string>`,
    '  <key>sendBrowserExamKey</key>',
    '  <false/>',
    '  <key>allowQuit</key>',
    '  <true/>',
    '  <key>browserWindowAllowAddressBar</key>',
    '  <false/>',
    '  <key>newBrowserWindowByLinkPolicy</key>',
    '  <integer>2</integer>',
    '  <key>enablePlugIns</key>',
    '  <false/>',
    '  <key>enableJavaScript</key>',
    '  <true/>',
    '  <key>URLFilterEnable</key>',
    '  <false/>',
    '  <key>showTaskBar</key>',
    '  <true/>',
    '  <key>enableAltEscape</key>',
    '  <false/>',
    '  <key>enableEsc</key>',
    '  <false/>',
    '  <key>allowSpellCheck</key>',
    '  <false/>',
    '  <key>zoomMode</key>',
    '  <integer>1</integer>',
    '  <key>browserUserAgent</key>',
    '  <string>SEB</string>',
    '</dict>',
    '</plist>',
  ].join('\n');
}

async function fetchPublishedExams() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exams?status=eq.published&select=id,share_id`,
    { headers: authHeaders }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch exams (${res.status}): ${text}`);
  }
  return res.json();
}

async function buildSebBinary(xmlString) {
  return await gzip(Buffer.from(xmlString, 'utf8'));
}

async function uploadSebFile(shareId, sebXml) {
  const filename  = `exam-${shareId}.seb`;
  const url       = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;
  const sebBinary = await buildSebBinary(sebXml);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey:        SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/octet-stream",
      "x-upsert":    "true",
    },
    body: sebBinary,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage upload failed (${res.status}): ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function updateExamSebUrl(examId, sebUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/exams?id=eq.${encodeURIComponent(examId)}`,
    {
      method: "PATCH",
      headers: { ...authHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ seb_url: sebUrl }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB update failed (${res.status}): ${text}`);
  }
}

async function main() {
  console.log("Fetching published exams...");
  const exams = await fetchPublishedExams();
  console.log(`Found ${exams.length} published exam(s).\n`);

  let ok = 0, fail = 0;

  for (const exam of exams) {
    const { id, share_id } = exam;
    process.stdout.write(`  [${share_id}] Generating SEB config... `);
    try {
      const sebXml = generateSebConfig(share_id);
      const sebUrl = await uploadSebFile(share_id, sebXml);
      await updateExamSebUrl(id, sebUrl);
      console.log(`OK — ${sebUrl}`);
      ok++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Unhandled error:", err.message);
  process.exit(1);
});
