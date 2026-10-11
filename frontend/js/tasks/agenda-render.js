// Tâches : rendu des vues de l'agenda.

function agendaEventTime(item) {
  if (item.type === "appointment" && item.startDate) {
    return new Date(item.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return item.type === "task" ? "Tâche" : "RDV";
}

function getAgendaEventPresentation(item) {
  return {
    id: item._id,
    type: item.type,
    status: item.status,
    timeLabel: agendaEventTime(item),
    title: item.title,
    contactLabel: taskContactLabel(item),
    canDuplicate: item.type === "appointment"
  };
}

function eventChip(item) {
  const event = getAgendaEventPresentation(item);
  return `<button type="button" class="agenda-event ${event.type} ${event.status}" onclick="editTask('${event.id}')"><time>${event.timeLabel}</time><span>${escapeHtml(event.title)}</span></button>`;
}

function renderMonthAgenda(cursor) {
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - (firstDay.getDay() + 6) % 7);

  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    .map(day => `<span>${day}</span>`)
    .join("");
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const events = eventsForDate(day);
    const outside = day.getMonth() !== cursor.getMonth();
    const overflow = events.length > 3 ? `<small>+${events.length - 3} autre(s)</small>` : "";
    return `<button type="button" class="agenda-day ${outside ? "outside" : ""} ${isSameDate(day, new Date()) ? "today" : ""} ${isSameDate(day, agendaSelectedDate) ? "selected" : ""}" onclick="selectAgendaDate('${agendaKey(day)}')"><span>${day.getDate()}</span><div>${events.slice(0, 3).map(eventChip).join("")}${overflow}</div></button>`;
  }).join("");

  return `<div class="agenda-weekdays">${weekdays}</div><div class="agenda-month-grid">${days}</div>`;
}

function renderWeekAgenda(cursor) {
  const firstDay = new Date(cursor);
  firstDay.setDate(cursor.getDate() - (cursor.getDay() + 6) % 7);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    const events = eventsForDate(day);
    const content = events.length ? events.map(eventChip).join("") : "<small>Libre</small>";
    return `<section class="agenda-week-day ${isSameDate(day, new Date()) ? "today" : ""}"><button type="button" onclick="selectAgendaDate('${agendaKey(day)}')"><b>${day.toLocaleDateString("fr-FR", { weekday: "short" })}</b><strong>${day.getDate()}</strong></button><div>${content}</div></section>`;
  }).join("");

  return {
    label: `Semaine du ${firstDay.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
    content: `<div class="agenda-week-grid">${days}</div>`
  };
}

function countYearMonthEvents(year, month) {
  return allTasks.filter(task => {
    const date = agendaItemDate(task);
    return date && new Date(date).getFullYear() === year && new Date(date).getMonth() === month;
  }).length;
}

function renderYearAgenda(cursor) {
  const year = cursor.getFullYear();
  const months = Array.from({ length: 12 }, (_, month) => {
    const date = new Date(year, month, 1);
    const count = countYearMonthEvents(year, month);
    return `<button type="button" onclick="agendaCursor=new Date(${year},${month},1);setAgendaView('month')"><span>${date.toLocaleDateString("fr-FR", { month: "long" })}</span><strong>${count}</strong><small>action${count > 1 ? "s" : ""}</small></button>`;
  }).join("");

  return `<div class="agenda-year-grid">${months}</div>`;
}

function renderDayEvent(item) {
  const event = getAgendaEventPresentation(item);
  const duplicate = event.canDuplicate
    ? `<button type="button" class="secondary-btn agenda-duplicate-btn" onclick="duplicateAppointment('${event.id}')">Dupliquer</button>`
    : "";
  return `<article class="agenda-day-event ${event.type}"><time>${event.timeLabel}</time><div><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.contactLabel)}</span></div><button type="button" class="secondary-btn" onclick="editTask('${event.id}')">Voir</button>${duplicate}</article>`;
}

function renderDayAgenda(day) {
  const events = eventsForDate(day);
  const content = events.length ? events.map(renderDayEvent).join("") : '<p class="empty-state">Aucune action planifiée ce jour.</p>';
  return `<div class="agenda-day-view"><button type="button" class="agenda-day-create" onclick="prepareAppointment('${agendaKey(day)}')">+ Planifier un rendez-vous</button>${content}</div>`;
}

function getAgendaDayDetailsPresentation(day, events) {
  const count = events.length;
  return {
    dateLabel: day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    actionLabel: count ? `${count} action${count > 1 ? "s" : ""} planifiée${count > 1 ? "s" : ""}` : "Journée disponible",
    dateKey: agendaKey(day)
  };
}

function renderAgendaDayDetails(detail) {
  if (agendaView === "list" || agendaView === "year") {
    detail.innerHTML = "";
    return;
  }

  const selected = eventsForDate(agendaSelectedDate);
  const presentation = getAgendaDayDetailsPresentation(agendaSelectedDate, selected);
  detail.innerHTML = `<div><strong>${presentation.dateLabel}</strong><span>${presentation.actionLabel}</span></div><button type="button" class="secondary-btn" onclick="prepareAppointment('${presentation.dateKey}')">Planifier</button>`;
}

function renderAgenda() {
  const calendar = document.getElementById("agendaCalendar");
  const detail = document.getElementById("agendaDayDetails");
  const label = document.getElementById("agendaPeriodLabel");
  if (!calendar || !detail) return;

  if (agendaView === "month") {
    label.textContent = agendaCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    calendar.innerHTML = renderMonthAgenda(agendaCursor);
  } else if (agendaView === "week") {
    const week = renderWeekAgenda(agendaCursor);
    label.textContent = week.label;
    calendar.innerHTML = week.content;
  } else if (agendaView === "year") {
    label.textContent = String(agendaCursor.getFullYear());
    calendar.innerHTML = renderYearAgenda(agendaCursor);
  } else if (agendaView === "day") {
    label.textContent = agendaSelectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    calendar.innerHTML = renderDayAgenda(agendaSelectedDate);
  } else {
    label.textContent = "Toutes les actions";
    calendar.innerHTML = "";
  }

  renderAgendaDayDetails(detail);
}
