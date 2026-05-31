import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")              ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function dbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey":        SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type":  "application/json",
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function dbPatch(path: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      "apikey":        SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { attempt_id, session_token, answers_json, last_autosave_at } = await req.json();

    if (!attempt_id || !session_token || !answers_json) {
      return respond({ error: "Missing required fields" }, 400);
    }

    // ── 1. Fetch attempt — verify it exists and session token matches ────────
    const attemptRes = await dbGet(
      `exam_attempts?id=eq.${encodeURIComponent(attempt_id)}` +
      `&select=session_token,status&limit=1`
    );

    if (!attemptRes.ok || !attemptRes.data || attemptRes.data.length === 0) {
      return respond({ error: "Attempt not found" }, 404);
    }

    const attempt = attemptRes.data[0];

    // ── 2. Verify session token ──────────────────────────────────────────────
    if (attempt.session_token !== session_token) {
      return respond({ error: "Unauthorized" }, 403);
    }

    // ── 3. Do not overwrite a submitted exam ─────────────────────────────────
    if (attempt.status === "submitted") {
      return respond({ error: "Exam already submitted" }, 409);
    }

    // ── 4. Save answers ──────────────────────────────────────────────────────
    const patchRes = await dbPatch(
      `exam_attempts?id=eq.${encodeURIComponent(attempt_id)}`,
      {
        answers_json:     answers_json,
        last_autosave_at: last_autosave_at ?? new Date().toISOString(),
      }
    );

    if (!patchRes.ok) {
      return respond({ error: "Failed to save" }, 500);
    }

    return respond({ saved: true });

  } catch (e) {
    console.error("exam-autosave unhandled error:", String(e));
    return respond({ error: "Internal server error" }, 500);
  }
});
