// Tâches : export et actions contextuelles de l'agenda.

function exportAppointmentToCalendar(item) {
  const data = getAppointmentCalendarData(item);
  if (!data) return;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([data.content], { type: "text/calendar;charset=utf-8" }));
  link.download = data.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Rendez-vous exporté vers votre calendrier.");
}

function createAgendaActionButton({ className, label, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.onclick = onClick;
  return button;
}

function getAgendaAppointmentActionsPresentation(item) {
  const actions = [{ key: "export", className: "secondary-btn agenda-export-btn", label: "Ajouter au calendrier" }];
  if (item.contactId?.email || item.freeContactEmail) {
    actions.push({ key: "confirmation", className: "secondary-btn agenda-confirmation-btn", label: "Envoyer la confirmation" });
  }
  if (item.recurrenceGroup) {
    actions.push({ key: "deleteSeries", className: "expense-text-action danger agenda-series-delete-btn", label: "Supprimer cette série" });
  }
  return actions;
}

function addAgendaExportButtons() {
  if (agendaView !== "day") return;

  const appointments = eventsForDate(agendaSelectedDate).filter(item => item.type === "appointment");
  document.querySelectorAll(".agenda-day-event.appointment").forEach((card, index) => {
    if (card.querySelector(".agenda-export-btn")) return;

    const item = appointments[index];
    if (!item) return;

    const handlers = {
      export: () => exportAppointmentToCalendar(item),
      confirmation: () => sendAppointmentConfirmation(item),
      deleteSeries: () => deleteFutureRecurringAppointments(item)
    };
    getAgendaAppointmentActionsPresentation(item).forEach(action => {
      card.appendChild(createAgendaActionButton({ ...action, onClick: handlers[action.key] }));
    });
  });
}
