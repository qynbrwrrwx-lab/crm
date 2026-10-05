const mongoose = require("mongoose");
const Contact = require("../../models/contact");
const STAGES = new Set(["lead", "qualified", "proposal", "won", "lost"]);
const STAGE_PROBABILITIES = { lead: 20, qualified: 40, proposal: 70, won: 100, lost: 0 };
function getOpportunityData(body = {}) { const stage = STAGES.has(body.stage) ? body.stage : "lead"; return { title: String(body.title || "").trim(), contactId: body.contactId || null, amount: Math.max(0, Number(body.amount) || 0), probability: Math.min(100, Math.max(0, Number(body.probability) || 0)), source: String(body.source || "manual").trim().slice(0, 80) || "manual", stage, lostReason: stage === "lost" ? String(body.lostReason || "").trim().slice(0, 100) : "", expectedCloseDate: body.expectedCloseDate || null, notes: String(body.notes || "").trim() }; }
async function contactIsOwned(contactId, userId) { return !contactId || (mongoose.isValidObjectId(contactId) && await Contact.exists({ _id: contactId, userId })); }
module.exports = { STAGES, STAGE_PROBABILITIES, contactIsOwned, getOpportunityData };
