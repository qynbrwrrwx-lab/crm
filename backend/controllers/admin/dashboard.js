const AuditLog = require("../../models/auditLog");
const Invoice = require("../../models/invoice");
const User = require("../../models/user");

async function getAdminStats(req, res) {
  try {
    const [totalUsers, verifiedUsers, documents, paidInvoices, subscriptions, trialsEndingSoon] = await Promise.all([
      User.countDocuments(), User.countDocuments({ isVerified: true }), Invoice.countDocuments(),
      Invoice.find({ type: "invoice", paymentStatus: "paid" }).select("totalTTC"),
      User.aggregate([{ $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } }]),
      User.countDocuments({ subscriptionStatus: "trial", trialEndsAt: { $gte: new Date(), $lte: new Date(Date.now() + 259200000) } })
    ]);
    const counts = Object.fromEntries(subscriptions.map(item => [item._id || "trial", item.count]));
    return res.json({ totalUsers, verifiedUsers, pendingVerification: totalUsers - verifiedUsers, documents, revenue: paidInvoices.reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0), trials: counts.trial || 0, activeSubscriptions: counts.active || 0, trialsEndingSoon });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger les statistiques" });
  }
}

async function getAdminAudit(req, res) {
  try {
    return res.json(await AuditLog.find({ action: { $regex: "^admin\\." } }).sort({ createdAt: -1 }).limit(50).select("action metadata createdAt userId"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger le journal d'audit" });
  }
}

module.exports = { getAdminAudit, getAdminStats };
