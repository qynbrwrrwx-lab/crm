// Tâches : sélection et navigation dans l'agenda.

function selectAgendaDate(key) {
  agendaSelectedDate = new Date(`${key}T12:00:00`);
  if (agendaView === "month") renderAgenda();
  else setAgendaView("day");
}

function setAgendaView(view) {
  agendaView = view;
  document.querySelectorAll("[data-agenda-view]").forEach(button => button.classList.toggle("active", button.dataset.agendaView === view));
  renderAgenda();
  addAgendaExportButtons();
  showAppointmentConfirmationStatus();
}

function shiftAgendaPeriod(offset) {
  if (agendaView === "month") agendaCursor = new Date(agendaCursor.getFullYear(), agendaCursor.getMonth() + offset, 1);
  else if (agendaView === "year") agendaCursor = new Date(agendaCursor.getFullYear() + offset, 0, 1);
  else if (agendaView === "week") {
    agendaCursor = new Date(agendaCursor);
    agendaCursor.setDate(agendaCursor.getDate() + offset * 7);
  } else {
    agendaSelectedDate = new Date(agendaSelectedDate);
    agendaSelectedDate.setDate(agendaSelectedDate.getDate() + offset);
    agendaCursor = new Date(agendaSelectedDate);
  }
  renderAgenda();
  addAgendaExportButtons();
  showAppointmentConfirmationStatus();
}

function goToAgendaToday() {
  agendaCursor = new Date();
  agendaSelectedDate = new Date();
  renderAgenda();
  addAgendaExportButtons();
  showAppointmentConfirmationStatus();
}
