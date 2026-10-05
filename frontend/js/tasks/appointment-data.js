// Tâches : données préremplies lors de la duplication d'un rendez-vous.

function getDuplicateAppointmentData(appointment) {
  const start = new Date(appointment.startDate);
  const end = appointment.endDate ? new Date(appointment.endDate) : new Date(start.getTime() + 3600000);
  start.setDate(start.getDate() + 7);
  end.setDate(end.getDate() + 7);
  return { start, end, title: appointment.title || "", contactId: appointment.contactId?._id || "", reminderMinutes: String(appointment.reminderMinutes || 0), priority: appointment.priority || "normal", location: appointment.location || "", freeContactName: appointment.freeContactName || "", freeContactEmail: appointment.freeContactEmail || "", freeContactPhone: appointment.freeContactPhone || "", notes: appointment.notes || "" };
}
