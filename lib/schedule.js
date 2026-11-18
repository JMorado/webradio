const dayMs = 86_400_000;
const minuteMs = 60_000;

export const stationZone = "Europe/Lisbon";

const localFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: stationZone,
  dateStyle: "short",
  timeStyle: "short",
  hourCycle: "h23",
});

function localStamp(instant) {
  return localFormat.format(instant).replace(" ", "T");
}

function dayOf(stamp) {
  return new Date(stamp).toISOString().slice(0, 10);
}

function dayAfter(day, count) {
  return dayOf(Date.parse(day + "T00:00Z") + count * dayMs);
}

function startInstant(day, time) {
  const local = day + "T" + time;
  const guess = Date.parse(local + "Z");
  // Sample both sides of the day to account for Lisbon's clock changes.
  const candidates = [guess - dayMs, guess + dayMs].map((sample) => {
    const offset = Date.parse(localStamp(sample) + "Z") - sample;
    return guess - offset;
  }).filter((candidate) => localStamp(candidate) === local);
  return candidates.length ? Math.min(...candidates) : null;
}

export function validateProgramme(input) {
  if (!input || typeof input !== "object") throw new RangeError("Preenche os dados do programa.");
  const { starts_on, starts_at, duration_minutes, weekly, published } = input;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const host = typeof input.host === "string" ? input.host.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";

  if (!title || title.length > 100 || host.length > 80 || description.length > 500) {
    throw new RangeError("Verifica o título, o nome do DJ e a descrição.");
  }
  const validDay = typeof starts_on === "string" && /^[1-9]\d{3}-\d{2}-\d{2}$/.test(starts_on)
    && Number.isFinite(Date.parse(starts_on)) && dayOf(starts_on) === starts_on;
  if (!validDay || typeof starts_at !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(starts_at)) {
    throw new RangeError("Escolhe uma data e uma hora válidas.");
  }
  if (startInstant(starts_on, starts_at) === null) {
    throw new RangeError("Esta hora não existe no dia da mudança da hora. Escolhe outra.");
  }
  if (!Number.isInteger(duration_minutes) || duration_minutes < 5 || duration_minutes > 1440) {
    throw new RangeError("A duração tem de estar entre 5 e 1440 minutos.");
  }
  if (typeof weekly !== "boolean" || typeof published !== "boolean") {
    throw new RangeError("Confirma a repetição e o estado do programa.");
  }
  return [title, host, description, starts_on, starts_at, duration_minutes, Number(weekly), Number(published)];
}

export async function upcomingProgrammes(db, now = Date.now()) {
  const today = localStamp(now).slice(0, 10);
  // An overnight show of up to 24 hours may still be running after a clock change.
  const firstDay = dayAfter(today, -2);
  const lastDay = dayAfter(today, 6);
  const { results } = await db.prepare(
    `SELECT id, title, host, description, starts_on, starts_at, duration_minutes, weekly
     FROM programmes
     WHERE published = 1 AND starts_on <= ? AND (weekly = 1 OR starts_on >= ?)`
  ).bind(lastDay, firstDay).all();

  const entries = [];
  for (const programme of results) {
    let day = programme.starts_on;
    if (programme.weekly && day < firstDay) {
      const weeks = Math.ceil((Date.parse(firstDay) - Date.parse(day)) / (7 * dayMs));
      day = dayAfter(day, weeks * 7);
    }
    while (day <= lastDay) {
      const start = startInstant(day, programme.starts_at);
      const end = start === null ? null : start + programme.duration_minutes * minuteMs;
      if (end !== null && end > now) {
        entries.push({
          id: programme.id,
          title: programme.title,
          host: programme.host,
          description: programme.description,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
        });
      }
      if (!programme.weekly) break;
      day = dayAfter(day, 7);
    }
  }
  entries.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title, "pt-PT"));
  return { today, timeZone: stationZone, entries };
}
