// functions/api/person-day.js
// GET /api/person-day?person=Gabriel

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const person = url.searchParams.get('person');

  if (!person) {
    return new Response(JSON.stringify({ error: 'Missing person parameter' }), { status: 400 });
  }

  const personRow = await env.DB.prepare(
    'SELECT * FROM people WHERE name = ?'
  ).bind(person).first();

  if (!personRow) {
    return new Response(JSON.stringify({ error: 'Unknown person: ' + person }), { status: 404 });
  }

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
    todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }), { headers: { 'content-type': 'application/json' } });
}
