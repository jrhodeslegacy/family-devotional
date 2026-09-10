// functions/[name].js
// Matches any single path segment, e.g. /Gabriel, /Preston, /Lydia
// Serves the exact same page shell each time — the client-side JS reads
// the actual name from the URL itself and fetches that person's data.

export async function onRequestGet(context) {
  const asset = await context.env.ASSETS.fetch(new URL('/person.html', context.request.url));
  return new Response(asset.body, {
    headers: { 'content-type': 'text/html;charset=UTF-8' }
  });
}
