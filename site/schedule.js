(function () {
  "use strict";

  const list = document.getElementById("scheduleList");
  const status = document.getElementById("scheduleStatus");
  const timeZone = "Europe/Lisbon";
  const stationDate = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const weekday = new Intl.DateTimeFormat("pt-PT", { timeZone, weekday: "long", month: "short", day: "numeric" });
  const clock = new Intl.DateTimeFormat("pt-PT", { timeZone, hour: "2-digit", minute: "2-digit" });
  let lastSchedule = "";
  let fetching = false;

  function report(message) {
    if (status.textContent !== message) status.textContent = message;
  }

  function renderEntry(entry, today) {
    const start = new Date(entry.startsAt);
    const end = new Date(entry.endsAt);
    const date = document.createElement("div");
    date.className = "schedule-date";
    const day = document.createElement("span");
    const startedToday = stationDate.format(start) === today;
    day.textContent = startedToday ? "Hoje" : weekday.format(start);
    const time = document.createElement("time");
    time.dateTime = entry.startsAt;
    time.textContent = clock.format(start) + "–" + clock.format(end);
    date.append(day, time);

    const details = document.createElement("div");
    details.className = "schedule-details";
    const title = document.createElement("h3");
    title.textContent = entry.title;
    details.append(title);

    if (entry.host) {
      const host = document.createElement("p");
      host.className = "schedule-host";
      host.textContent = entry.host;
      details.append(host);
    }

    const summary = document.createElement("div");
    summary.className = "schedule-summary";
    summary.append(date, details);

    const item = document.createElement("li");
    item.className = "schedule-row page-columns";
    item.append(summary);

    if (entry.description) {
      const description = document.createElement("p");
      description.className = "schedule-description";
      description.textContent = entry.description;
      item.append(description);
    }
    return item;
  }

  async function updateSchedule() {
    if (fetching || document.hidden) return;
    fetching = true;
    try {
      const response = await fetch("/api/programacao", { cache: "no-store" });
      if (!response.ok) throw new Error("Schedule unavailable");
      const payload = await response.json();
      const signature = JSON.stringify(payload);
      if (lastSchedule !== signature) {
        list.replaceChildren(...payload.entries.map((entry) => renderEntry(entry, payload.today)));
        lastSchedule = signature;
      }
      report(payload.entries.length ? "" : "Ainda não há programas marcados para os próximos dias.");
    } catch {
      report(list.children.length
        ? "Sem ligação. A mostrar a última programação disponível."
        : "Programação temporariamente indisponível.");
    } finally {
      fetching = false;
    }
  }

  updateSchedule();
  window.setInterval(updateSchedule, 30000);
  document.addEventListener("visibilitychange", updateSchedule);
})();
