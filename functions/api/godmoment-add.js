// functions/api/godmoment-add.js
// POST /api/godmoment-add   body: { "person", "text", "mediaBase64", "mediaMimeType", "mediaType" }
//
// Media files are stored in Cloudflare R2 (not the database) and served
// from R2's public URL. Paste your bucket's public URL below — see
// DEPLOYMENT instructions, "Setting up media storage (R2)".

const R2_PUBLIC_URL = 'https://pub-1f8a061802874249b369479398103a5b.r2.dev'; // e.g. https://pub-abc123.r2.dev

const MAX_SIZES = {
  photo: 15 * 1024 * 1024,  // 15MB
  audio: 15 * 1024 * 1024,  // 15MB
  video: 25 * 1024 * 1024   // 25MB — keep clips short, under ~20 seconds
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const { person, text, mediaBase64, mediaMimeType, mediaType } = await request.json();
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  let mediaUrl = null;
  if (mediaBase64 && mediaMimeType) {
    const bytes = Uint8Array.from(atob(mediaBase64), c => c.charCodeAt(0));
    const maxSize = MAX_SIZES[mediaType] || MAX_SIZES.photo;

    if (bytes.length > maxSize) {
      return new Response(JSON.stringify({
        error: `File too large — limit is ${Math.round(maxSize / 1024 / 1024)}MB for ${mediaType || 'this type'}.`
      }), { status: 400 });
    }

    const ext = (mediaMimeType.split('/')[1] || 'bin').split(';')[0];
    const key = `${id}.${ext}`;

    await env.MEDIA_BUCKET.put(key, bytes, { httpMetadata: { contentType: mediaMimeType } });
    mediaUrl = `${R2_PUBLIC_URL}/${key}`;
  }

  await env.DB.prepare(
    'INSERT INTO god_moments (id, name, text, media_type, media_data, date_added) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, person, text || '', mediaType || null, mediaUrl, today).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
