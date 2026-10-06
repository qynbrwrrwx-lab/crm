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

function renderTaskRow(task) {
  const date = task.type === "appointment" ? taskDateTime(task.startDate) : taskDate(task.dueDate);
  const completion = task.status === "open"
    ? `<button class="secondary-btn" onclick="completeTask('${task._id}')">${task.type === "appointment" ? "Réalisé" : "Terminer"}</button>`
    : "";

  return `<article class="task-row ${task.status} ${task.type} priority-${task.priority}"><div><span>${taskListStatusLabel(task)}</span><h3>${escapeHtml(task.title)}</h3><small>${escapeHtml(taskContactLabel(task))} · ${date}</small></div><div class="expense-actions"><button class="secondary-btn" onclick="editTask('${task._id}')">Détails</button>${completion}<button class="expense-text-action danger" onclick="deleteTask('${task._id}')">Supprimer</button></div></article>`;
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
