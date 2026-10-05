const mongoose = require("mongoose");
const Contact = require("../models/contact");

const REMINDER_MINUTES = new Set([0, 15, 30, 60, 1440]);
const PRIORITIES = new Set(["low", "normal", "high"]);

function getTaskPayload(body = {}) {
  return {
    title: String(body.title || "").trim(), type: body.type === "appointment" ? "appointment" : "task",
    contactId: body.contactId || null, dueDate: body.dueDate || null, startDate: body.startDate || null, endDate: body.endDate || null,
    reminderMinutes: REMINDER_MINUTES.has(Number(body.reminderMinutes)) ? Number(body.reminderMinutes) : 0,
    freeContactName: String(body.freeContactName || "").trim(), freeContactEmail: String(body.freeContactEmail || "").trim(), freeContactPhone: String(body.freeContactPhone || "").trim(),
    location: String(body.location || "").trim(), notes: String(body.notes || "").trim(), priority: PRIORITIES.has(body.priority) ? body.priority : "normal"
  };
}

async function validateTaskPayload(data, userId) {
  if (!data.title) return "Le titre est obligatoire";
  if (data.contactId && (!mongoose.isValidObjectId(data.contactId) || !await Contact.exists({ _id: data.contactId, userId }))) return "Le client associé est introuvable";
  if (data.type === "appointment" && !data.startDate) return "La date et l’heure du rendez-vous sont obligatoires";
  if (data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate)) return "La fin ne peut pas être antérieure au début";
  return null;
}

module.exports = { getTaskPayload, validateTaskPayload };
