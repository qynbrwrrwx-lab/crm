const DocumentCounter = require("../models/documentCounter");
const Invoice = require("../models/invoice");

const prefixes = {
  quote: "DEV",
  order: "CMD",
  invoice: "FAC",
  credit_note: "AVO"
};

function getHighestSequence(invoiceNumber) {
  const sequence = Number(String(invoiceNumber || "").split("-").pop());
  return Number.isSafeInteger(sequence) && sequence > 0 ? sequence : 0;
}

async function nextDocumentNumber(userId, type) {
  const prefix = prefixes[type];
  if (!prefix) throw new Error("Type de document invalide");

  const year = new Date().getFullYear();
  const key = `${userId}:${type}:${year}`;
  let counter = await DocumentCounter.findOne({ key });

  if (!counter) {
    // A count is not reliable when a quote has been deleted: it can reuse an
    // existing number. The padded number can be sorted lexicographically.
    const latestDocument = await Invoice.findOne({
      userId,
      type,
      invoiceNumber: new RegExp(`^${prefix}-${year}-\\d+$`)
    })
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber")
      .lean();

    const nextValue = getHighestSequence(latestDocument?.invoiceNumber) + 1;

    try {
      counter = await DocumentCounter.create({ key, value: nextValue });
    } catch (err) {
      if (err.code !== 11000) throw err;
      counter = await DocumentCounter.findOneAndUpdate(
        { key },
        { $inc: { value: 1 } },
        { new: true }
      );
    }
  } else {
    counter = await DocumentCounter.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { new: true }
    );
  }

  return `${prefix}-${year}-${String(counter.value).padStart(5, "0")}`;
}

module.exports = { getHighestSequence, nextDocumentNumber };
