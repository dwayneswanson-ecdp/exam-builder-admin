import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_KEY  = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM        = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";
// testflo-dark.svg = white text logo — correct for dark navy header
const LOGO_URL    = "https://dwayneswanson-ecdp.github.io/exam-builder-admin/testflo-dark.svg";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { type, ...p } = await req.json();
    let payload;

    if (type === "results") {
      payload = {
        from: FROM,
        to: [p.to_email],
        subject: `Résultats — ${p.exam_title}`,
        html: resultsHtml(p),
      };
    } else if (type === "retake") {
      payload = {
        from: FROM,
        to: [p.to_email],
        subject: `Lien de reprise — ${p.exam_title}`,
        html: retakeHtml(p),
      };
    } else {
      return respond({ error: "Unknown type" }, 400);
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    return respond(r.ok ? { id: data.id } : { error: data }, r.ok ? 200 : r.status);
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

// ── Shared shell ──────────────────────────────────────────────────────────────

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
<div style="max-width:600px;margin:0 auto;">
  <div style="background:#0f172a;padding:24px 32px;">
    <img src="${LOGO_URL}" alt="testflo" height="28" style="display:block;">
  </div>
  ${content}
  <div style="padding:20px 0;text-align:center;font-size:11px;color:#94a3b8;">
    Ce message a été généré automatiquement par testflo.
  </div>
</div>
</body></html>`;
}

// ── Results email ─────────────────────────────────────────────────────────────

function resultsHtml(p: Record<string, unknown>) {
  const studentName   = String(p.student_name  || p.to_name || '');
  const examTitle     = String(p.exam_title    || '');
  const institution   = String(p.institution_name || '');
  const dateTaken     = String(p.date_taken    || '—');
  const scoreObtained = String(p.score_obtained ?? '—');
  const scoreTotal    = String(p.score_total   ?? '—');
  const scoreConverted = p.score_converted ? String(p.score_converted) : null;
  const teacherName   = String(p.teacher_name  || '');
  const toEmail       = String(p.to_email      || '');

  const questions = Array.isArray(p.questions) ? p.questions as Record<string, unknown>[] : null;

  // ── Header stripe (below logo, on white) ──────────────────────────────────
  const headerStripe = `
  <div style="background:#fff;padding:24px 32px 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    ${institution ? `<p style="margin:0 0 2px;font-size:0.68rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">${esc(institution)}</p>` : ''}
    <h2 style="margin:0 0 8px;font-size:1.15rem;font-weight:700;color:#0a0a0a;line-height:1.3;">${esc(examTitle)}</h2>
    <p style="margin:0;font-size:0.85rem;color:#475569;"><strong>${esc(studentName)}</strong>${toEmail ? ` · ${esc(toEmail)}` : ''}</p>
    <p style="margin:4px 0 0;font-size:0.8rem;color:#94a3b8;">Soumis le ${esc(dateTaken)}${teacherName ? ` · ${esc(teacherName)}` : ''}</p>
  </div>`;

  // ── Hero stats row ────────────────────────────────────────────────────────
  const pct = scoreTotal !== '0' && scoreTotal !== '—'
    ? Math.round((parseFloat(scoreObtained) / parseFloat(scoreTotal)) * 100)
    : null;

  const heroStats = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:0;">
    <tr>
      <td style="padding:20px 24px;border-right:1px solid #e2e8f0;vertical-align:top;width:50%;">
        <p style="margin:0 0 4px;font-size:0.6rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Score Total</p>
        <p style="margin:0;font-size:2rem;font-weight:700;color:#0a0a0a;line-height:1;">${esc(scoreObtained)} / ${esc(scoreTotal)}</p>
        ${pct !== null ? `<p style="margin:6px 0 0;font-size:0.8rem;color:#64748b;">${pct}%${scoreConverted ? ` · ${scoreConverted} / 20` : ''}</p>` : ''}
      </td>
      <td style="padding:20px 24px;vertical-align:top;width:50%;">
        <p style="margin:0 0 4px;font-size:0.6rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Date</p>
        <p style="margin:0;font-size:0.95rem;font-weight:600;color:#1e293b;">${esc(dateTaken)}</p>
        ${institution ? `<p style="margin:4px 0 0;font-size:0.78rem;color:#94a3b8;">${esc(institution)}</p>` : ''}
      </td>
    </tr>
  </table>`;

  // ── Question table ────────────────────────────────────────────────────────
  let questionTable = '';
  if (questions && questions.length > 0) {
    // ── MCQ rows ──────────────────────────────────────────────────────────────
    const mcqQs  = questions.filter(q => q.type === 'mcq');
    const openQs = questions.filter(q => q.type === 'open');

    const mcqRows = mcqQs.map((q, i) => {
      const options      = Array.isArray(q.options) ? q.options as string[] : [];
      const correctIdx   = typeof q.correct_index === 'number' ? q.correct_index : -1;
      const studentIdx   = typeof q.student_answer === 'number' ? q.student_answer : -1;
      const isCorrect    = studentIdx !== -1 && studentIdx === correctIdx;
      const correctText  = correctIdx >= 0 ? (options[correctIdx] ?? '—') : '—';
      const studentText  = studentIdx >= 0 ? (options[studentIdx] ?? 'Sans réponse') : 'Sans réponse';
      const rowBg        = i % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
      <tr style="background:${rowBg};">
        <td style="padding:10px 14px;font-size:0.78rem;color:#1e293b;border-bottom:1px solid #e2e8f0;vertical-align:top;max-width:220px;">${esc(String(q.text || ''))}</td>
        <td style="padding:10px 14px;font-size:0.78rem;border-bottom:1px solid #e2e8f0;vertical-align:top;${isCorrect ? 'color:#1e293b;' : 'color:#dc2626;font-weight:600;'}">${esc(studentText)}</td>
        <td style="padding:10px 14px;font-size:0.78rem;color:#1e293b;border-bottom:1px solid #e2e8f0;vertical-align:top;">${esc(correctText)}</td>
        <td style="padding:10px 14px;font-size:1rem;border-bottom:1px solid #e2e8f0;text-align:center;vertical-align:middle;${isCorrect ? 'color:#16a34a;' : 'color:#dc2626;'}">${isCorrect ? '✓' : '✗'}</td>
      </tr>`;
    }).join('');

    if (mcqRows) {
      questionTable += `
  <div style="margin-top:0;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:12px 24px;">
      <p style="margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Questions à choix multiple</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:left;border-bottom:1px solid #e2e8f0;">Question</th>
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:left;border-bottom:1px solid #e2e8f0;">Réponse candidat</th>
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:left;border-bottom:1px solid #e2e8f0;">Bonne réponse</th>
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:center;border-bottom:1px solid #e2e8f0;">Résultat</th>
        </tr>
      </thead>
      <tbody>${mcqRows}</tbody>
    </table>
  </div>`;
    }

    // ── Open question rows ────────────────────────────────────────────────────
    const openBlocks = openQs.filter(q => q.student_response || q.comment || q.open_score != null).map((q, i) => {
      const scoreLabel = q.open_score != null
        ? `<p style="margin:8px 0 0;font-size:0.78rem;font-weight:700;color:#475569;">Note : <strong>${q.open_score} / ${q.max_points ?? '?'}</strong></p>`
        : '';
      const responseBlock = q.student_response
        ? `<p style="margin:0 0 4px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Réponse</p>
           <p style="margin:0 0 10px;font-size:0.82rem;color:#475569;font-style:italic;white-space:pre-wrap;">${esc(String(q.student_response))}</p>`
        : '';
      const commentBlock = q.comment
        ? `<p style="margin:0 0 4px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">Commentaire de l'enseignant</p>
           <p style="margin:0;font-size:0.82rem;color:#1e293b;">${esc(String(q.comment))}</p>`
        : '';
      const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `
      <tr style="background:${rowBg};">
        <td style="padding:14px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #e2e8f0;font-weight:600;vertical-align:top;width:40%;">${esc(String(q.text || ''))}</td>
        <td style="padding:14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          ${responseBlock}${commentBlock}${scoreLabel}
        </td>
      </tr>`;
    }).join('');

    if (openBlocks) {
      questionTable += `
  <div style="margin-top:0;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:12px 24px;">
      <p style="margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Questions rédigées</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:left;border-bottom:1px solid #e2e8f0;width:40%;">Question</th>
          <th style="padding:10px 14px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;text-align:left;border-bottom:1px solid #e2e8f0;">Réponse · Commentaire · Note</th>
        </tr>
      </thead>
      <tbody>${openBlocks}</tbody>
    </table>
  </div>`;
    }
  }

  const body = headerStripe + heroStats + questionTable;
  return emailShell(body);
}

// ── Retake / resend email ─────────────────────────────────────────────────────

function retakeHtml(p: Record<string, unknown>) {
  const toName    = String(p.to_name   || p.student_name || '');
  const teacher   = String(p.teacher_name || '');
  const examTitle = String(p.exam_title || '');
  const link      = String(p.retake_link || '');

  const content = `
  <div style="background:#fff;padding:36px 32px;border:1px solid #e2e8f0;border-top:none;">
    <h2 style="margin:0 0 6px;font-size:1.1rem;color:#0a0a0a;">Bonjour ${esc(toName)},</h2>
    <p style="color:#64748b;font-size:0.9rem;margin:0 0 24px;">
      ${teacher ? `<strong>${esc(teacher)}</strong> vous a envoyé un lien de reprise pour` : 'Vous avez reçu un lien de reprise pour'}
      <strong>${esc(examTitle)}</strong>.
    </p>
    <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;text-decoration:none;font-weight:700;font-size:0.9rem;">Accéder à l'épreuve →</a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;">
    <p style="font-size:0.8rem;color:#64748b;margin:0;">Si le bouton ne fonctionne pas, copiez ce lien :<br>
      <span style="color:#2563eb;">${esc(link)}</span>
    </p>
    <p style="font-size:0.75rem;color:#94a3b8;margin:16px 0 0;">Ce lien est à usage unique.</p>
  </div>`;

  return emailShell(content);
}

// ── HTML escape ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
