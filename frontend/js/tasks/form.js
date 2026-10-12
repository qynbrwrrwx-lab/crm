// Interactions et appels API du formulaire de tâches.

function getTaskActionPresentation() {
  return {
    completionSuccessMessage: "Action marquée comme réalisée",
    deletion: {
      confirmation: {
        title: "Supprimer l’action",
        message: "Cette suppression est définitive.",
        actionLabel: "Supprimer",
        danger: true
      }
    }
  };
}

function taskContacts() {
  const select = document.getElementById("taskContact");
  if (!select || typeof allContacts === "undefined") return;

  const value = select.value;
  const options = allContacts
    .map(contact => `<option value="${contact._id}">${escapeHtml(contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client")}</option>`)
    .join("");
  select.innerHTML = '<option value="">Aucun client</option>' + options;
  select.value = value;
}

function ensureTaskRecurrenceFields() {
  if (document.getElementById("taskRecurrenceFrequency")) return;
  const location = document.getElementById("taskLocation")?.closest("label");
  if (!location) return;
  location.insertAdjacentHTML("beforebegin", '<label class="form-field appointment-field" hidden><span>Répétition</span><select id="taskRecurrenceFrequency"><option value="none">Ne pas répéter</option><option value="weekly">Chaque semaine</option><option value="monthly">Chaque mois</option></select></label><label class="form-field appointment-field" hidden><span>Nombre de rendez-vous</span><input id="taskRecurrenceCount" type="number" min="2" max="24" value="4" /></label>');
}

function toggleTaskType() {
  ensureTaskRecurrenceFields();
  const isAppointment = document.getElementById("taskType")?.value === "appointment";
  document.querySelectorAll(".appointment-field").forEach(element => { element.hidden = !isAppointment; });
  document.querySelectorAll(".task-date-field").forEach(element => { element.hidden = isAppointment; });

  const label = document.getElementById("taskTitleLabel");
  const button = document.getElementById("taskSubmitButton");
  if (label) label.innerHTML = isAppointment ? 'Objet du rendez-vous <small>Obligatoire</small>' : 'Tâche <small>Obligatoire</small>';
  if (button) button.textContent = document.getElementById("taskEditId")?.value ? "Enregistrer les modifications" : isAppointment ? "Planifier le rendez-vous" : "Ajouter la tâche";
}

function scrollToTaskForm() {
  document.getElementById("taskForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editTask(id) {
  const task = allTasks.find(item => item._id === id);
  if (!task) return;

  populateTaskForm(task);
  document.getElementById("taskFormTitle").textContent = task.type === "appointment" ? "Modifier le rendez-vous" : "Modifier la tâche";
  document.getElementById("taskCancelEdit").hidden = false;
  toggleTaskType();
  scrollToTaskForm();
}

function resetTaskForm() {
  const form = document.getElementById("taskForm");
  if (!form) return;
  form.reset();
  document.getElementById("taskEditId").value = "";
  document.getElementById("taskFormTitle").textContent = "Créer une action";
  document.getElementById("taskCancelEdit").hidden = true;
  toggleTaskType();
}

function taskSaveMessage({ id, type, payload }) {
  if (id) return "Action modifiée";
  if (type === "appointment" && payload.recurrenceFrequency !== "none") return `${payload.recurrenceCount} rendez-vous planifiés`;
  return "Action ajoutée";
}

async function saveTask(event) {
  event.preventDefault();
  const { id, title, type, payload } = readTaskFormSubmission();
  if (!title) return;

  try {
    await apiFetch(`/api/tasks${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    resetTaskForm();
    showToast(taskSaveMessage({ id, type, payload }));
    await loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}

async function completeTask(id) {
  const presentation = getTaskActionPresentation();
  try {
    await apiFetch(`/api/tasks/${id}/done`, { method: "PUT" });
    showToast(presentation.completionSuccessMessage);
    await loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteTask(id) {
  const presentation = getTaskActionPresentation();
  const confirmed = await confirmAppAction(presentation.deletion.confirmation);
  if (!confirmed) return;

  try {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}
