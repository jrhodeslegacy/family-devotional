// functions/api/complete.js
// POST /api/complete   body: { "person": "Gabriel" }

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { person } = await request.json();

  const personRow = await env.DB.prepare(
    'SELECT * FROM people WHERE name = ?'
  ).bind(person).first();

  if (!personRow) {
    return new Response(JSON.stringify({ error: 'Unknown person: ' + person }), { status: 404 });
  }

  const today = todayStr();

  if (personRow.last_completed === today) {
    // Already completed today, no double counting — just return current state.
    return getCurrentDay(env, person, personRow);
  }

  const isConsecutive = personRow.last_completed === yesterdayStr();
  const newStreak = isConsecutive ? personRow.streak + 1 : 1;
  const newTotal = personRow.total_completed + 1;
  const newDayIndex = personRow.current_day + 1;

  await env.DB.prepare(
    'UPDATE people SET streak = ?, last_completed = ?, total_completed = ?, current_day = ? WHERE name = ?'
  ).bind(newStreak, today, newTotal, newDayIndex, person).run();

  const updatedRow = await env.DB.prepare('SELECT * FROM people WHERE name = ?').bind(person).first();
  return getCurrentDay(env, person, updatedRow);
}

async function getCurrentDay(env, person, personRow) {
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as c FROM devotional_days WHERE person = ?'
  ).bind(person).first();
  const numDays = countRow.c;
  const dayIndex = ((personRow.current_day - 1) % numDays) + 1;

  const day = await env.DB.prepare(
    'SELECT * FROM devotional_days WHERE person = ? AND day_number = ?'
  ).bind(person, dayIndex).first();

  return new Response(JSON.stringify({
    dayNumber: dayIndex,
    verseRef: day.ref,
    verseText: day.passage,
    devotional: day.devo,
    question: day.question,
    prayer: day.prayer,
    extReading: day.ext_reading,
    completedToday: true,
    streak: personRow.streak,
    totalCompleted: personRow.total_completed,
    todayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }), { headers: { 'content-type': 'application/json' } });
}
