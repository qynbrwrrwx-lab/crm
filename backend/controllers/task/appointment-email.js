const Task = require("../../models/task");
const Company = require("../../models/companyModel");
const User = require("../../models/user");
const { sendEmail } = require("../../services/emailService");

async function sendAppointmentConfirmation(req, res) {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId }).populate("contactId", "email firstname lastname companyName");
    if (!task || task.type !== "appointment") return res.status(404).json({ error: "Rendez-vous introuvable" });
    const to = task.contactId?.email || task.freeContactEmail;
    if (!to) return res.status(400).json({ error: "Le client ne possède pas d’adresse e-mail" });
    const [company, user] = await Promise.all([Company.findOne({ userId: req.userId }), User.findById(req.userId).select("email")]);
    const sender = String(company?.companyName || "Votre entreprise").replace(/[\r\n]/g, " ").trim().slice(0, 120);
    const sent = await sendEmail({ to, from: process.env.EMAIL_FROM ? `My Prospect — ${sender} <${process.env.EMAIL_FROM}>` : undefined, replyTo: company?.replyToEmail || company?.email || user?.email || undefined, subject: `Confirmation de rendez-vous — ${task.title}`, text: `Bonjour,\n\nNous vous confirmons notre rendez-vous : ${task.title}\nDate : ${new Date(task.startDate).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}${task.location ? `\nLieu / lien : ${task.location}` : ""}${task.notes ? `\n\nInformations : ${task.notes}` : ""}\n\nCordialement` });
    if (!sent) return res.status(502).json({ error: "L’e-mail de confirmation n’a pas pu être envoyé" });
    task.confirmationSentAt = new Date();
    await task.save();
    return res.json({ success: true, confirmationSentAt: task.confirmationSentAt });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de l’envoi de la confirmation" }); }
}

module.exports = { sendAppointmentConfirmation };
