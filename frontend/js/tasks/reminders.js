// Tâches : alertes du tableau de bord et rappels de rendez-vous.

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const REMINDER_GRACE_PERIOD_IN_MS = 35 * 60 * 1000;

function getOpenAppointments(tasks) {
  return tasks.filter(task => task.status === "open" && task.type === "appointment" && task.startDate);
}

function getUpcomingAppointment(tasks, now = Date.now()) {
  return getOpenAppointments(tasks)
    .filter(task => {
      const start = new Date(task.startDate).getTime();
      return start >= now && start - now <= DAY_IN_MS;
    })
    .sort((first, second) => new Date(first.startDate) - new Date(second.startDate))[0];
}

function updateTaskDashboardAlert(overdue, high) {
  const label = document.getElementById("dashboardTaskAlertLabel");
  const detail = document.getElementById("dashboardTaskAlertDetail");
  const button = document.getElementById("dashboardTaskAlertButton");
  const dot = document.getElementById("dashboardTaskAlertDot");
  if (!label || !detail) return;

  if (overdue.length) {
    label.textContent = `${overdue.length} tâche${overdue.length > 1 ? "s" : ""} en retard`;
    detail.textContent = "À traiter en priorité.";
    dot?.classList.add("overdue");
  } else if (high.length) {
    label.textContent = `${high.length} action${high.length > 1 ? "s" : ""} prioritaire${high.length > 1 ? "s" : ""}`;
    detail.textContent = "Actions importantes à planifier.";
    dot?.classList.remove("overdue");
  } else {
    label.textContent = "Aucune action prioritaire";
    detail.textContent = "Vos prochaines actions apparaîtront ici.";
    dot?.classList.remove("overdue");
  }
  if (button) button.onclick = () => showSection("tasksSection");
}

function updateUpcomingAppointmentAlert() {
  const next = getUpcomingAppointment(allTasks);
  if (!next) return;

  const label = document.getElementById("dashboardTaskAlertLabel");
  const detail = document.getElementById("dashboardTaskAlertDetail");
  const button = document.getElementById("dashboardTaskAlertButton");
  const dot = document.getElementById("dashboardTaskAlertDot");
  if (!label || !detail) return;

  label.textContent = `Rendez-vous imminent : ${next.title}`;
  detail.textContent = `Prévu ${taskDateTime(next.startDate)} avec ${taskContactLabel(next)}.`;
  dot?.classList.remove("overdue");
  if (button) {
    button.onclick = () => {
      showSection("tasksSection");
      editTask(next._id);
    };
  }
}

function updateAgendaNotificationButton() {
  const button = document.getElementById("agendaNotificationButton");
  if (!button || !("Notification" in window)) return;
  if (Notification.permission === "granted") button.textContent = "Rappels activés";
  else if (Notification.permission === "denied") button.textContent = "Rappels bloqués";
}

async function requestAgendaNotifications() {
  if (!("Notification" in window)) {
    showToast("Les notifications ne sont pas disponibles dans ce navigateur.");
    return;
  }

  const permission = await Notification.requestPermission();
  updateAgendaNotificationButton();
  showToast(permission === "granted" ? "Rappels navigateur activés." : "Autorisation de rappel non accordée.");
}

function checkAgendaReminders() {
  const now = Date.now();
  getOpenAppointments(allTasks)
    .filter(task => Number(task.reminderMinutes) > 0)
    .forEach(task => {
      const trigger = new Date(task.startDate).getTime() - Number(task.reminderMinutes) * 60000;
      const key = `agenda-reminder-${task._id}-${trigger}`;
      const isDue = trigger <= now && now - trigger < REMINDER_GRACE_PERIOD_IN_MS;
      if (!isDue || sessionStorage.getItem(key)) return;

      sessionStorage.setItem(key, "1");
      const message = `${task.title} commence ${taskDateTime(task.startDate)}.`;
      showToast(`Rappel : ${message}`);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("My Prospect — Rendez-vous", { body: message });
      }
    });
  updateAgendaNotificationButton();
}
