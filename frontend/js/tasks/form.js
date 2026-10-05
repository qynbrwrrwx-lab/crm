// Interactions et appels API du formulaire de tâches.
function taskContacts() {
  const select = document.getElementById("taskContact");
  if (!select || typeof allContacts === "undefined") return;
  const value = select.value;
  select.innerHTML = '<option value="">Aucun client</option>' + allContacts.map(contact => `<option value="${contact._id}">${escapeHtml(contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client")}</option>`).join("");
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
function editTask(id) {
  const task = allTasks.find(item => item._id === id);
  if (!task) return;
  populateTaskForm(task);
  document.getElementById("taskFormTitle").textContent = task.type === "appointment" ? "Modifier le rendez-vous" : "Modifier la tâche";
  document.getElementById("taskCancelEdit").hidden = false;
  toggleTaskType();
  document.getElementById("taskForm").scrollIntoView({ behavior: "smooth", block: "start" });
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

async function saveTask(event) {
  event.preventDefault();
  const { id, title, type, payload } = readTaskFormSubmission();
  if (!title) return;
  try {
    await apiFetch(`/api/tasks${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    resetTaskForm();
    showToast(id ? "Action modifiée" : type === "appointment" && payload.recurrenceFrequency !== "none" ? `${payload.recurrenceCount} rendez-vous planifiés` : "Action ajoutée");
    loadTasks();
  } catch (err) {
    showToast(err.message);
  }
}

async function completeTask(id) {
  try {
    await apiFetch(`/api/tasks/${id}/done`, { method: "PUT" });
    showToast("Action marquée comme réalisée");
    loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteTask(id) {
  if (!await confirmAppAction({ title: "Supprimer l’action", message: "Cette suppression est définitive.", actionLabel: "Supprimer", danger: true })) return;
  try {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (error) {
    showToast(error.message);
  }
}
