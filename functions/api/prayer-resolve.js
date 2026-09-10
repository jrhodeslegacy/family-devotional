// functions/api/prayer-resolve.js
// POST /api/prayer-resolve   body: { "id": "..." }

export async function onRequestPost(context) {
  const { request, env } = context;
  const { id } = await request.json();
  const today = new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    'UPDATE prayer_requests SET active = 0, archived_date = ? WHERE id = ?'
  ).bind(today, id).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
