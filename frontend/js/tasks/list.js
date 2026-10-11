// Tâches : liste, indicateurs et chargement de l'agenda.

function getTaskFilters() {
  return {
    query: document.getElementById("tasksFilter")?.value.toLowerCase() || "",
    status: document.getElementById("tasksStatusFilter")?.value || "open"
  };
}

function getTaskCountersPresentation(tasks, { open, overdue, high, upcoming }) {
  return {
    totalLabel: `${tasks.length} élément${tasks.length > 1 ? "s" : ""}`,
    openTaskCount: open.filter(task => task.type === "task").length,
    upcomingAppointmentCount: upcoming.length,
    highPriorityCount: high.length,
    overdueCount: overdue.length
  };
}

function updateTaskCounters(presentation) {
  const counters = [
    ["tasksCount", presentation.counters.totalLabel],
    ["tasksOpenCount", presentation.counters.openTaskCount],
    ["appointmentsUpcomingCount", presentation.counters.upcomingAppointmentCount],
    ["tasksHighCount", presentation.counters.highPriorityCount],
    ["tasksOverdueCount", presentation.counters.overdueCount]
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

function getTaskListPresentation(tasks, data) {
  return {
    counters: getTaskCountersPresentation(tasks, data),
    rows: data.shown.map(getTaskRowPresentation),
    emptyMessage: "Aucune action à afficher."
  };
}

function renderTaskRowPresentation(row) {
  const completion = row.completionLabel
    ? `<button class="secondary-btn" onclick="completeTask('${row.id}')">${row.completionLabel}</button>`
    : "";

  return `<article class="${row.className}"><div><span>${row.statusLabel}</span><h3>${escapeHtml(row.title)}</h3><small>${escapeHtml(row.detail)}</small></div><div class="expense-actions"><button class="secondary-btn" onclick="editTask('${row.id}')">Détails</button>${completion}<button class="expense-text-action danger" onclick="deleteTask('${row.id}')">Supprimer</button></div></article>`;
}

function renderTaskRow(task) {
  return renderTaskRowPresentation(getTaskRowPresentation(task));
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

  const presentation = getTaskListPresentation(allTasks, data);
  updateTaskCounters(presentation);
  updateTaskDashboardAlert(data.overdue, data.high);
  list.innerHTML = presentation.rows.length
    ? presentation.rows.map(renderTaskRowPresentation).join("")
    : `<p class="empty-state">${presentation.emptyMessage}</p>`;
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
