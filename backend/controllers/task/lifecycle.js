const mongoose = require("mongoose");
const Task = require("../../models/task");
const { getTaskPayload, validateTaskPayload } = require("../../services/taskValidationService");

function getRecurrence(body = {}) {
  return { frequency: ["weekly", "monthly"].includes(body.recurrenceFrequency) ? body.recurrenceFrequency : "none", count: Math.min(24, Math.max(2, Number(body.recurrenceCount) || 2)) };
}

function shiftRecurrenceDate(value, index, frequency) {
  if (!value) return null;
  const date = new Date(value);
  if (frequency === "weekly") date.setDate(date.getDate() + index * 7);
  else date.setMonth(date.getMonth() + index);
  return date;
}

async function listTasks(req, res) {
  try { return res.json(await Task.find({ userId: req.userId }).populate("contactId", "firstname lastname companyName").sort({ status: 1, dueDate: 1, createdAt: -1 })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la récupération de l'agenda" }); }
}

async function createTask(req, res) {
  try {
    const data = getTaskPayload(req.body), recurrence = getRecurrence(req.body);
    const error = await validateTaskPayload(data, req.userId);
    if (error) return res.status(400).json({ error });
    if (data.type !== "appointment" || recurrence.frequency === "none") return res.status(201).json(await Task.create({ userId: req.userId, ...data }));
    const recurrenceGroup = new mongoose.Types.ObjectId().toString();
    const tasks = Array.from({ length: recurrence.count }, (_, index) => ({ ...data, userId: req.userId, recurrenceGroup, startDate: shiftRecurrenceDate(data.startDate, index, recurrence.frequency), endDate: shiftRecurrenceDate(data.endDate, index, recurrence.frequency) }));
    return res.status(201).json(await Task.create(tasks));
  } catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la création de l'action" }); }
}

async function updateTask(req, res) {
  try { const data = getTaskPayload(req.body); const error = await validateTaskPayload(data, req.userId); if (error) return res.status(400).json({ error }); const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, data, { new: true }); if (!task) return res.status(404).json({ error: "Élément introuvable" }); return res.json(task); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la modification de l'action" }); }
}

async function markTaskDone(req, res) { const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { status: "done" }, { new: true }); return task ? res.json(task) : res.status(404).json({ error: "Tâche introuvable" }); }
async function deleteTask(req, res) { const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId }); return task ? res.json({ success: true }) : res.status(404).json({ error: "Tâche introuvable" }); }
async function deleteFutureRecurrences(req, res) { const task = await Task.findOne({ _id: req.params.id, userId: req.userId }); if (!task || task.type !== "appointment" || !task.recurrenceGroup) return res.status(404).json({ error: "Série de rendez-vous introuvable" }); const result = await Task.deleteMany({ userId: req.userId, recurrenceGroup: task.recurrenceGroup, status: "open", startDate: { $gte: task.startDate } }); return res.json({ success: true, deletedCount: result.deletedCount }); }

module.exports = { createTask, deleteFutureRecurrences, deleteTask, listTasks, markTaskDone, updateTask };
