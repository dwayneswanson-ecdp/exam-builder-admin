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
    const { attempt_id, session_token, answers, session_log } = await req.json();

    if (!attempt_id || !session_token || !answers) {
      return respond({ error: "Missing required fields" }, 400);
    }

    // ── 1. Verify session token and check attempt status ─────────────────────
    const attemptRes = await dbGet(
      `exam_attempts?id=eq.${encodeURIComponent(attempt_id)}` +
      `&select=exam_id,session_token,status&limit=1`
    );

    if (!attemptRes.ok || !attemptRes.data || attemptRes.data.length === 0) {
      return respond({ error: "Attempt not found" }, 404);
    }

    const attempt = attemptRes.data[0];

    if (attempt.session_token !== session_token) {
      return respond({ error: "Unauthorized" }, 403);
    }

    if (attempt.status === "submitted") {
      return respond({ error: "Attempt already submitted" }, 409);
    }

    // ── 2. Fetch questions WITH correct_index — service role only ────────────
    const questionsRes = await dbGet(
      `questions?exam_id=eq.${encodeURIComponent(attempt.exam_id)}` +
      `&order=position.asc&select=id,type,correct_index,max_points`
    );

    if (!questionsRes.ok || !questionsRes.data) {
      console.error("exam-submit: questions fetch failed", questionsRes.status);
      return respond({ error: "Failed to fetch questions" }, 500);
    }

    const questions: Array<{ id: string; type: string; correct_index: number | null; max_points: number }> =
      questionsRes.data;

    // ── 3. Grade MCQ server-side — client score is never used ────────────────
    let scoreMCQ  = 0;
    let totalMCQ  = 0;

    // sections consume no answer slot — use non-section index to match exam-engine storage
    let nonSectionIdx = 0;
    questions.forEach((q) => {
      if (q.type === "section") return;
      const idx = nonSectionIdx++;
      if (q.type !== "mcq") return;
      totalMCQ++;
      const studentAnswer = answers[`q${idx}`];
      if (
        studentAnswer !== undefined &&
        studentAnswer !== null &&
        studentAnswer !== -1 &&
        Number(studentAnswer) === q.correct_index
      ) {
        scoreMCQ++;
      }
    });

    // ── 4. Save result — only values computed server-side are stored ──────────
    const saveRes = await dbPatch(
      `exam_attempts?id=eq.${encodeURIComponent(attempt_id)}`,
      {
        status:       "submitted",
        score_mcq:    scoreMCQ,       // server-computed, never from client
        answers_json: answers,        // raw student answers stored for teacher review
        session_log:  session_log ?? [],
        submitted_at: new Date().toISOString(),
      }
    );

    if (!saveRes.ok) {
      console.error("exam-submit: patch failed", saveRes.status);
      return respond({ error: "Failed to save submission" }, 500);
    }

    // ── 5. Return server-computed score only ─────────────────────────────────
    return respond({ score_mcq: scoreMCQ, total_mcq: totalMCQ });

  } catch (e) {
    console.error("exam-submit unhandled error:", String(e));
    return respond({ error: "Internal server error" }, 500);
  }
});
