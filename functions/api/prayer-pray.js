// functions/api/prayer-pray.js
// POST /api/prayer-pray   body: { "id": "...", "person": "Gabriel" }

export async function onRequestPost(context) {
  const { request, env } = context;
  const { id, person } = await request.json();

  const row = await env.DB.prepare('SELECT praying_names FROM prayer_requests WHERE id = ?').bind(id).first();
  if (!row) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  let names = row.praying_names ? row.praying_names.split(',').filter(x => x) : [];
  if (!names.includes(person)) names.push(person);

  await env.DB.prepare('UPDATE prayer_requests SET praying_names = ? WHERE id = ?')
    .bind(names.join(','), id).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
