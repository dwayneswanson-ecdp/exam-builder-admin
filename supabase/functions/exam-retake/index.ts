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
    const { retake_token } = await req.json();

    if (!retake_token || typeof retake_token !== "string" || retake_token.trim() === "") {
      return respond({ error: "Missing required fields" }, 400);
    }

    // ── 1. Fetch attempt by retake token — service role only ─────────────────
    const attemptRes = await dbGet(
      `exam_attempts?retake_token=eq.${encodeURIComponent(retake_token.trim())}` +
      `&select=id&limit=1`
    );

    if (!attemptRes.ok || !attemptRes.data || attemptRes.data.length === 0) {
      return respond({ error: "Retake token not found or already used" }, 404);
    }

    const attemptId = attemptRes.data[0].id;

    // ── 2. Generate new session token server-side ────────────────────────────
    const newSessionToken = crypto.randomUUID();

    // ── 3. Invalidate retake token and set new session token atomically ───────
    const patchRes = await dbPatch(
      `exam_attempts?id=eq.${encodeURIComponent(attemptId)}`,
      {
        retake_token:  null,            // single-use — consumed immediately
        session_token: newSessionToken, // fresh token for this retake session
        status:        "active",        // reset so exam-submit accepts the new submission
      }
    );

    if (!patchRes.ok) {
      console.error("exam-retake: patch failed", patchRes.status);
      return respond({ error: "Failed to process retake token" }, 500);
    }

    // ── 4. Return only what the client needs to proceed ───────────────────────
    // attempt_id is a non-guessable UUID required by exam-questions and exam-submit
    // No student PII (name, email, answers, score) is returned
    return respond({
      attempt_id:    attemptId,
      session_token: newSessionToken,
    });

  } catch (e) {
    console.error("exam-retake unhandled error:", String(e));
    return respond({ error: "Internal server error" }, 500);
  }
});
