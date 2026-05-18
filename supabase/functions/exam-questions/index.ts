import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")              ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Columns returned to the client — correct_index, correct_option, and
// grading_criteria are deliberately omitted (answer key + teacher rubric)
const QUESTION_COLS = [
  "id", "exam_id", "position", "type",
  "question_text",
  "option_a", "option_b", "option_c", "option_d",
  "media_type", "media_src", "media_name",
  "max_points",
  "section_media_src", "section_media_type",
  "pool_total", "pool_draw", "page_break",
].join(",");

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { attempt_id, session_token } = await req.json();

    if (!attempt_id || !session_token) {
      return respond({ error: "Missing required fields" }, 400);
    }

    // ── 1. Verify session token ──────────────────────────────────────────────
    const attemptRes = await dbGet(
      `exam_attempts?id=eq.${encodeURIComponent(attempt_id)}` +
      `&select=exam_id,session_token&limit=1`
    );

    if (!attemptRes.ok || !attemptRes.data || attemptRes.data.length === 0) {
      return respond({ error: "Attempt not found" }, 404);
    }

    const attempt = attemptRes.data[0];

    if (attempt.session_token !== session_token) {
      return respond({ error: "Unauthorized" }, 403);
    }

    // ── 2. Fetch questions — answer key columns never selected ───────────────
    const questionsRes = await dbGet(
      `questions?exam_id=eq.${encodeURIComponent(attempt.exam_id)}` +
      `&order=position.asc&select=${QUESTION_COLS}`
    );

    if (!questionsRes.ok) {
      console.error("exam-questions: fetch failed", questionsRes.status, JSON.stringify(questionsRes.data));
      return respond({ error: "Failed to fetch questions" }, 500);
    }

    return respond({ questions: questionsRes.data ?? [] });

  } catch (e) {
    console.error("exam-questions unhandled error:", String(e));
    return respond({ error: "Internal server error" }, 500);
  }
});
