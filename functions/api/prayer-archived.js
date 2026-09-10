// functions/api/prayer-archived.js
// GET /api/prayer-archived

export async function onRequestGet(context) {
  const { env } = context;
  const result = await env.DB.prepare(
    'SELECT * FROM prayer_requests WHERE active = 0 ORDER BY archived_date DESC'
  ).all();
  const list = result.results.map(pr => ({
    id: pr.id,
    requester: pr.requester,
    text: pr.text,
    dateAdded: pr.date_added,
    archivedDate: pr.archived_date
  }));
  return new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json' } });
}
