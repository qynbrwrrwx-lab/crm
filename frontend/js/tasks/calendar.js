// tasks : calendar.

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

function addAgendaExportButtons(){if(agendaView!=="day")return;const appointments=eventsForDate(agendaSelectedDate).filter(item=>item.type==="appointment");document.querySelectorAll(".agenda-day-event.appointment").forEach((card,index)=>{if(card.querySelector(".agenda-export-btn"))return;const item=appointments[index];if(!item)return;const button=document.createElement("button");button.type="button";button.className="secondary-btn agenda-export-btn";button.textContent="Ajouter au calendrier";button.onclick=()=>exportAppointmentToCalendar(item);card.appendChild(button);if(item.contactId?.email||item.freeContactEmail){const confirmation=document.createElement("button");confirmation.type="button";confirmation.className="secondary-btn agenda-confirmation-btn";confirmation.textContent="Envoyer la confirmation";confirmation.onclick=()=>sendAppointmentConfirmation(item);card.appendChild(confirmation);}if(item.recurrenceGroup){const removeSeries=document.createElement("button");removeSeries.type="button";removeSeries.className="expense-text-action danger agenda-series-delete-btn";removeSeries.textContent="Supprimer cette série";removeSeries.onclick=()=>deleteFutureRecurringAppointments(item);card.appendChild(removeSeries);}});}
