// Tâches : actions et préremplissage des rendez-vous.

function getAppointmentConfirmationPresentation(item) {
  return {
    confirmation: {
      title: "Envoyer la confirmation",
      message: `Envoyer la confirmation du rendez-vous à ${taskContactLabel(item)} ?`,
      actionLabel: "Envoyer"
    },
    successMessage: "Confirmation de rendez-vous envoyée."
  };
}

function getFutureAppointmentDeletionPresentation(deletedCount = 0) {
  return {
    confirmation: {
      title: "Supprimer les rendez-vous à venir",
      message: "Cette occurrence et toutes les suivantes seront supprimées. Les rendez-vous déjà réalisés resteront dans l’historique.",
      actionLabel: "Supprimer la série",
      danger: true
    },
    successMessage: `${deletedCount} rendez-vous à venir supprimé(s).`
  };
}

function showAppointmentConfirmationStatus() {
  if (agendaView !== "day") return;

  const appointments = eventsForDate(agendaSelectedDate).filter(item => item.type === "appointment");
  document.querySelectorAll(".agenda-day-event.appointment").forEach((card, index) => {
    const item = appointments[index];
    if (!item?.confirmationSentAt || card.querySelector(".agenda-confirmation-status")) return;

    const status = document.createElement("small");
    status.className = "agenda-confirmation-status";
    status.textContent = `Confirmation envoyée le ${new Date(item.confirmationSentAt).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })}`;
    card.querySelector("div")?.appendChild(status);
  });
}

async function sendAppointmentConfirmation(item) {
  const presentation = getAppointmentConfirmationPresentation(item);
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;

  try {
    await apiFetch(`/api/tasks/${item._id}/send-confirmation`, { method: "POST" });
    showToast(presentation.successMessage);
    await loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteFutureRecurringAppointments(item) {
  const presentation = getFutureAppointmentDeletionPresentation();
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;

  try {
    const result = await apiFetch(`/api/tasks/${item._id}/future-recurrences`, { method: "DELETE" });
    showToast(getFutureAppointmentDeletionPresentation(result.deletedCount || 0).successMessage);
    await loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}

function focusAppointmentForm() {
  document.getElementById("taskTitle").focus();
  document.getElementById("taskForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function prepareAppointment(dateKey) {
  resetTaskForm();
  const start = dateKey ? new Date(`${dateKey}T09:00:00`) : new Date();
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  document.getElementById("taskType").value = "appointment";
  document.getElementById("taskStartDate").value = localDateTime(start);
  document.getElementById("taskEndDate").value = localDateTime(end);
  toggleTaskType();
  focusAppointmentForm();
}

function duplicateAppointment(id) {
  const appointment = allTasks.find(item => item._id === id);
  if (!appointment || appointment.type !== "appointment") return;

  const data = getDuplicateAppointmentData(appointment);
  resetTaskForm();
  document.getElementById("taskType").value = "appointment";
  document.getElementById("taskTitle").value = data.title;
  document.getElementById("taskContact").value = data.contactId;
  document.getElementById("taskStartDate").value = localDateTime(data.start);
  document.getElementById("taskEndDate").value = localDateTime(data.end);
  document.getElementById("taskReminderMinutes").value = data.reminderMinutes;
  document.getElementById("taskPriority").value = data.priority;
  document.getElementById("taskLocation").value = data.location;
  document.getElementById("taskFreeContactName").value = data.freeContactName;
  document.getElementById("taskFreeContactEmail").value = data.freeContactEmail;
  document.getElementById("taskFreeContactPhone").value = data.freeContactPhone;
  document.getElementById("taskNotes").value = data.notes;
  document.getElementById("taskFormTitle").textContent = "Dupliquer le rendez-vous";
  toggleTaskType();
  focusAppointmentForm();
  showToast("Rendez-vous dupliqué : vérifiez la date avant d’enregistrer.");
}
