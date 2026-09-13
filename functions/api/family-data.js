// functions/api/family-data.js
// GET /api/family-data

function centralDateStr(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}
function todayStr() { return centralDateStr(new Date()); }
function yesterdayStr() { return centralDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000)); }

export async function onRequestGet(context) {
  const { env } = context;

  const peopleResult = await env.DB.prepare(
    'SELECT name, streak, total_completed, last_completed FROM people ORDER BY name'
  ).all();
  const today = todayStr();
  const yesterday = yesterdayStr();
  const people = peopleResult.results.map(p => {
    // If their last completion wasn't today or yesterday, the streak is
    // effectively broken — show 0 immediately rather than a stale number.
    const streakStillAlive = p.last_completed === today || p.last_completed === yesterday;
    return {
      name: p.name,
      streak: streakStillAlive ? p.streak : 0,
      total: p.total_completed
    };
  });
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
