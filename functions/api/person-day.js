// functions/api/person-day.js
// GET /api/person-day?token=eSAETRPi

function centralDateStr(d) {
  // Formats a date as YYYY-MM-DD in America/Chicago time (handles CST/CDT automatically)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}
function todayStr() { return centralDateStr(new Date()); }

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
  }

  const personRow = await env.DB.prepare(
    'SELECT * FROM people WHERE token = ?'
  ).bind(token).first();

  if (!personRow) {
    return new Response(JSON.stringify({ error: 'Invalid link' }), { status: 404 });
  }

  const person = personRow.name;

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as c FROM devotional_days WHERE person = ?'
  ).bind(person).first();
  const numDays = countRow.c;

  const dayIndex = ((personRow.current_day - 1) % numDays) + 1;

  const day = await env.DB.prepare(
    'SELECT * FROM devotional_days WHERE person = ? AND day_number = ?'
  ).bind(person, dayIndex).first();

  const completedToday = personRow.last_completed === todayStr();

  return new Response(JSON.stringify({
    personName: person,
    dayNumber: dayIndex,
    verseRef: day.ref,
    verseText: day.passage,
    devotional: day.devo,
    question: day.question,
    prayer: day.prayer,
    extReading: day.ext_reading,
    completedToday,
    streak: personRow.streak,
    totalCompleted: personRow.total_completed,
    todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Chicago' })
  }), { headers: { 'content-type': 'application/json' } });
}
