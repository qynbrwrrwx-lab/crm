// Tâches : liste, indicateurs et chargement de l'agenda.

function getTaskFilters() {
  return {
    query: document.getElementById("tasksFilter")?.value.toLowerCase() || "",
    status: document.getElementById("tasksStatusFilter")?.value || "open"
  };
}

function updateTaskCounters({ open, overdue, high, upcoming }) {
  const counters = [
    ["tasksCount", `${allTasks.length} élément${allTasks.length > 1 ? "s" : ""}`],
    ["tasksOpenCount", open.filter(task => task.type === "task").length],
    ["appointmentsUpcomingCount", upcoming.length],
    ["tasksHighCount", high.length],
    ["tasksOverdueCount", overdue.length]
  ];

  counters.forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function taskListStatusLabel(task) {
  if (task.type === "appointment") return "Rendez-vous";
  if (task.priority === "high") return "Priorité haute";
  return task.status === "done" ? "Terminée" : "À faire";
}

function getTaskRowPresentation(task) {
  const isAppointment = task.type === "appointment";
  return {
    id: task._id,
    className: `task-row ${task.status} ${task.type} priority-${task.priority}`,
    statusLabel: taskListStatusLabel(task),
    title: task.title,
    detail: `${taskContactLabel(task)} · ${isAppointment ? taskDateTime(task.startDate) : taskDate(task.dueDate)}`,
    completionLabel: task.status === "open" ? (isAppointment ? "Réalisé" : "Terminer") : ""
  };
}

function renderTaskRow(task) {
  const row = getTaskRowPresentation(task);
  const completion = row.completionLabel
    ? `<button class="secondary-btn" onclick="completeTask('${row.id}')">${row.completionLabel}</button>`
    : "";

  return `<article class="${row.className}"><div><span>${row.statusLabel}</span><h3>${escapeHtml(row.title)}</h3><small>${escapeHtml(row.detail)}</small></div><div class="expense-actions"><button class="secondary-btn" onclick="editTask('${row.id}')">Détails</button>${completion}<button class="expense-text-action danger" onclick="deleteTask('${row.id}')">Supprimer</button></div></article>`;
}

function renderTasks() {
  const list = document.getElementById("tasksList");
  if (!list) return;

  const { query, status } = getTaskFilters();
  const data = getTaskListData(allTasks, {
    query,
    status,
    today: agendaDateOnly(new Date()),
    now: new Date()
  });

  updateTaskCounters(data);
  updateTaskDashboardAlert(data.overdue, data.high);
  list.innerHTML = data.shown.length
    ? data.shown.map(renderTaskRow).join("")
    : '<p class="empty-state">Aucune action à afficher.</p>';
  renderAgenda();
}

function startAgendaReminderTimer() {
  if (!agendaReminderTimer) agendaReminderTimer = setInterval(checkAgendaReminders, 30000);
}

async function loadTasks() {
  try {
    allTasks = await apiFetch("/api/tasks");
    taskContacts();
    renderTasks();
    showAppointmentConfirmationStatus();
    updateUpcomingAppointmentAlert();
    checkAgendaReminders();
    startAgendaReminderTimer();
  } catch (error) {
    console.error(error);
  }
}
