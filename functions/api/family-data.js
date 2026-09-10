// functions/api/family-data.js
// GET /api/family-data

export async function onRequestGet(context) {
  const { env } = context;

  const peopleResult = await env.DB.prepare(
    'SELECT name, streak, total_completed FROM people ORDER BY name'
  ).all();
  const people = peopleResult.results.map(p => ({
    name: p.name,
    streak: p.streak,
    total: p.total_completed
  }));
  const familyActiveToday = people.filter(p => p.streak > 0).length;

  const prResult = await env.DB.prepare(
    'SELECT * FROM prayer_requests WHERE active = 1 ORDER BY date_added DESC'
  ).all();
  const prayerRequests = prResult.results.map(pr => ({
    id: pr.id,
    requester: pr.requester,
    text: pr.text,
    dateAdded: pr.date_added,
    prayingNames: pr.praying_names ? pr.praying_names.split(',').filter(x => x) : []
  }));

  const przResult = await env.DB.prepare(
    'SELECT * FROM praise_reports ORDER BY date_added DESC'
  ).all();
  const praiseReports = przResult.results.map(p => ({
    id: p.id, name: p.name, text: p.text, dateAdded: p.date_added
  }));

  const gmResult = await env.DB.prepare(
    'SELECT * FROM god_moments ORDER BY date_added DESC'
  ).all();
  const godMoments = gmResult.results.map(g => ({
    id: g.id, name: g.name, text: g.text,
    mediaType: g.media_type, mediaUrl: g.media_data,
    dateAdded: g.date_added
  }));

  const verseResult = await env.DB.prepare(
    'SELECT text, reference FROM family_verses ORDER BY RANDOM() LIMIT 1'
  ).first();

  return new Response(JSON.stringify({
    streaks: { people, familyActiveToday },
    prayerRequests,
    praiseReports,
    godMoments,
    familyVerse: verseResult
  }), { headers: { 'content-type': 'application/json' } });
}
