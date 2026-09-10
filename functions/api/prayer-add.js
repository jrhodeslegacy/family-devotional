// functions/api/prayer-add.js
// POST /api/prayer-add   body: { "person": "Gabriel", "text": "..." }

export async function onRequestPost(context) {
  const { request, env } = context;
  const { person, text } = await request.json();
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    'INSERT INTO prayer_requests (id, requester, text, date_added, active, praying_names) VALUES (?, ?, ?, ?, 1, ?)'
  ).bind(id, person, text, today, '').run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
