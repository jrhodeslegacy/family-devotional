// functions/api/praise-add.js
// POST /api/praise-add   body: { "person": "Gabriel", "text": "..." }

export async function onRequestPost(context) {
  const { request, env } = context;
  const { person, text } = await request.json();
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    'INSERT INTO praise_reports (id, name, text, date_added) VALUES (?, ?, ?, ?)'
  ).bind(id, person, text, today).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
