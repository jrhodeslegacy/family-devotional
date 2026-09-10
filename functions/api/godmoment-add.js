// functions/api/godmoment-add.js
// POST /api/godmoment-add   body: { "person", "text", "mediaBase64", "mediaType" }
// mediaBase64/mediaType are optional (text-only moments pass them as null).
// Media is stored directly in the database as a data URL — keep files small
// (under ~800KB) since D1 has a practical row-size limit.

export async function onRequestPost(context) {
  const { request, env } = context;
  const { person, text, mediaBase64, mediaMimeType, mediaType } = await request.json();
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  let mediaData = null;
  if (mediaBase64 && mediaMimeType) {
    if (mediaBase64.length > 1100000) { // ~800KB before base64 inflation
      return new Response(JSON.stringify({ error: 'File too large — please use something under 800KB.' }), { status: 400 });
    }
    mediaData = `data:${mediaMimeType};base64,${mediaBase64}`;
  }

  await env.DB.prepare(
    'INSERT INTO god_moments (id, name, text, media_type, media_data, date_added) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, person, text || '', mediaType || null, mediaData, today).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
