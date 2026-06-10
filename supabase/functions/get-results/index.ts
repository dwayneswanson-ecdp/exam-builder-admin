import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const url = new URL(req.url);
    const attemptId = url.searchParams.get("attempt");

    if (!attemptId || !isUUID(attemptId)) {
      return respond({ error: "Missing or invalid attempt ID" }, 400);
    }

    // Fetch the attempt
    const { data: attempt, error: aErr } = await supabaseAdmin
      .from("exam_attempts")
      .select("id,exam_id,student_name,student_email,group_name,status,score_mcq,answers_json,open_scores,open_comments,pool_selection,submitted_at,results_sent_at")
      .eq("id", attemptId)
      .single();

    if (aErr || !attempt) {
      return respond({ error: "Results not found" }, 404);
    }

    if (attempt.status === "void") {
      return respond({ error: "Results not available" }, 410);
    }

    // Fetch the exam
    const { data: exam, error: eErr } = await supabaseAdmin
      .from("exams")
      .select("id,title,lang,teacher_id,teacher_email")
      .eq("id", attempt.exam_id)
      .single();

    if (eErr || !exam) {
      return respond({ error: "Exam not found" }, 404);
    }

    // Fetch teacher profile
    let teacher = { name: "", email: exam.teacher_email || "" };
    let institution = "";
    if (exam.teacher_id) {
      const { data: profile } = await supabaseAdmin
        .from("teachers")
        .select("full_name,email,institution")
        .eq("id", exam.teacher_id)
        .single();
      if (profile) {
        teacher = { name: profile.full_name || "", email: profile.email || exam.teacher_email || "" };
        institution = profile.institution || "";
      }
    }

    // Fetch questions ordered by position
    const { data: questions, error: qErr } = await supabaseAdmin
      .from("questions")
      .select("id,position,type,question_text,option_a,option_b,option_c,option_d,correct_index,max_points,pool_draw,pool_total")
      .eq("exam_id", attempt.exam_id)
      .order("position", { ascending: true });

    if (qErr) {
      return respond({ error: "Could not load questions" }, 500);
    }

    // Compute score_max server-side (pool-aware)
    let scoreMax = 0;
    let curSecId: string | null = null;
    const secDrawn: Record<string, number> = {};
    const secSeen: Record<string, number> = {};
    for (const q of questions || []) {
      if (q.type === "section") {
        curSecId = q.id;
        if (q.pool_draw) secDrawn[q.id] = q.pool_draw;
        secSeen[q.id] = 0;
        continue;
      }
      if (curSecId && secDrawn[curSecId] !== undefined) {
        if (secSeen[curSecId] >= secDrawn[curSecId]) continue;
        secSeen[curSecId]++;
      }
      scoreMax += q.type === "mcq" ? 1 : (q.max_points || 5);
    }

    return respond({
      attempt: {
        id: attempt.id,
        student_name: attempt.student_name,
        student_email: attempt.student_email,
        group_name: attempt.group_name,
        status: attempt.status,
        score_mcq: attempt.score_mcq,
        answers_json: attempt.answers_json || {},
        open_scores: attempt.open_scores || {},
        open_comments: attempt.open_comments || {},
        pool_selection: attempt.pool_selection || {},
        submitted_at: attempt.submitted_at,
        results_sent_at: attempt.results_sent_at,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        lang: exam.lang || "fr",
        institution_name: institution,
        score_max: scoreMax || null,
      },
      questions: (questions || []).map(q => ({
        id: q.id,
        position: q.position,
        type: q.type,
        question_text: q.question_text || "",
        option_a: q.option_a || "",
        option_b: q.option_b || "",
        option_c: q.option_c || "",
        option_d: q.option_d || "",
        correct_index: q.correct_index,
        max_points: q.max_points,
        pool_draw: q.pool_draw,
        pool_total: q.pool_total,
      })),
      teacher,
      score_max: scoreMax,
    });

  } catch (e) {
    return respond({ error: String(e) }, 500);
  }
});

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
