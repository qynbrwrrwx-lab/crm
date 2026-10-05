// Tâches : sélection et indicateurs de la liste.

function getTaskListData(tasks, { query, status, today, now }) {
  const open = tasks.filter(task => task.status === "open");
  const overdue = open.filter(task => task.type === "task" && task.dueDate && agendaDateOnly(task.dueDate) < today);
  const high = open.filter(task => task.priority === "high");
  const upcoming = open.filter(task => task.type === "appointment" && task.startDate && new Date(task.startDate) >= now);
  const shown = tasks.filter(task => (status === "all" || task.status === status) && [task.title, taskContactLabel(task), task.location, task.notes].join(" ").toLowerCase().includes(query));
  return { open, overdue, high, upcoming, shown };
}
