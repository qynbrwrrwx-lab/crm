const SubscriptionInvoice = require("../models/subscriptionInvoice");

function parseSubscriptionAmount(value) { const amount = Number(value); return Number.isFinite(amount) && amount >= 0 && amount <= 1000000 ? amount : null; }
function parseSubscriptionVatRate(value) { const rate = Number(value); return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : null; }
function parseOptionalDate(value) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date; }
async function nextSubscriptionInvoiceNumber() { const year = new Date().getFullYear(), prefix = `MP-ABO-${year}-`; const latest = await SubscriptionInvoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) }).sort({ invoiceNumber: -1 }).select("invoiceNumber").lean(); const previous = Number(String(latest?.invoiceNumber || "").slice(prefix.length)); return `${prefix}${String((Number.isFinite(previous) ? previous : 0) + 1).padStart(5, "0")}`; }
module.exports = { nextSubscriptionInvoiceNumber, parseOptionalDate, parseSubscriptionAmount, parseSubscriptionVatRate };
