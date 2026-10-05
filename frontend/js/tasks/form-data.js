// Lecture et remplissage du formulaire de tâches et rendez-vous.
function populateTaskForm(task) {
  document.getElementById("taskEditId").value = task._id || "";
  document.getElementById("taskType").value = task.type || "task";
  document.getElementById("taskTitle").value = task.title || "";
  document.getElementById("taskContact").value = task.contactId?._id || "";
  document.getElementById("taskDueDate").value = task.dueDate ? agendaKey(task.dueDate) : "";
  document.getElementById("taskStartDate").value = localDateTime(task.startDate);
  document.getElementById("taskEndDate").value = localDateTime(task.endDate);
  document.getElementById("taskReminderMinutes").value = String(task.reminderMinutes || 0);
  document.getElementById("taskPriority").value = task.priority || "normal";
  document.getElementById("taskLocation").value = task.location || "";
  document.getElementById("taskFreeContactName").value = task.freeContactName || "";
  document.getElementById("taskFreeContactEmail").value = task.freeContactEmail || "";
  document.getElementById("taskFreeContactPhone").value = task.freeContactPhone || "";
  document.getElementById("taskNotes").value = task.notes || "";
}

function readTaskFormSubmission() {
  const id = document.getElementById("taskEditId").value;
  const title = document.getElementById("taskTitle").value.trim();
  const type = document.getElementById("taskType").value;

  return {
    id,
    title,
    type,
    payload: {
      title,
      type,
      contactId: document.getElementById("taskContact").value || null,
      dueDate: document.getElementById("taskDueDate").value || null,
      startDate: document.getElementById("taskStartDate").value || null,
      endDate: document.getElementById("taskEndDate").value || null,
      reminderMinutes: Number(document.getElementById("taskReminderMinutes").value || 0),
      recurrenceFrequency: document.getElementById("taskRecurrenceFrequency")?.value || "none",
      recurrenceCount: Number(document.getElementById("taskRecurrenceCount")?.value || 4),
      priority: document.getElementById("taskPriority").value,
      location: document.getElementById("taskLocation").value.trim(),
      freeContactName: document.getElementById("taskFreeContactName").value.trim(),
      freeContactEmail: document.getElementById("taskFreeContactEmail").value.trim(),
      freeContactPhone: document.getElementById("taskFreeContactPhone").value.trim(),
      notes: document.getElementById("taskNotes").value.trim()
    }
  };
}
