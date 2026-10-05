const crypto = require("crypto");
const Invoice = require("../../models/invoice");
const User = require("../../models/user");
const { recordAuditEvent } = require("../../services/auditService");
const { sendVerificationEmail } = require("../../services/emailService");

async function listUsers(req, res) {
  try {
    return res.json(await User.find().select("-password"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

async function getUserSummary(req, res) {
  try {
    const user = await User.findById(req.params.id).select("email role isVerified subscriptionStatus trialEndsAt createdAt updatedAt");
    if (!user) return res.status(404).json({ error: "Compte introuvable" });
    const [documents, invoices, latestDocument] = await Promise.all([
      Invoice.countDocuments({ userId: user._id }),
      Invoice.countDocuments({ userId: user._id, type: "invoice" }),
      Invoice.findOne({ userId: user._id }).sort({ updatedAt: -1 }).select("updatedAt")
    ]);
    return res.json({ user, documents, invoices, lastActivityAt: latestDocument?.updatedAt || null });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Compte introuvable" });
  }
}

async function updateUserSuspension(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") return res.status(400).json({ error: "Action indisponible" });
    user.isSuspended = Boolean(req.body.suspended);
    await user.save();
    await recordAuditEvent({ userId: req.user._id, action: user.isSuspended ? "admin.user_suspended" : "admin.user_reactivated", metadata: { targetUserId: user._id.toString(), targetEmail: user.email } });
    return res.json({ success: true, isSuspended: user.isSuspended });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de modifier la suspension" });
  }
}

async function updateUserSubscription(req, res) {
  try {
    if (!["trial", "active", "suspended", "cancelled"].includes(req.body.status)) return res.status(400).json({ error: "Statut invalide" });
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") return res.status(400).json({ error: "Action indisponible" });
    user.subscriptionStatus = req.body.status;
    await user.save();
    await recordAuditEvent({ userId: req.user._id, action: "admin.subscription_updated", metadata: { targetUserId: user._id.toString(), targetEmail: user.email, status: user.subscriptionStatus } });
    return res.json({ success: true, status: user.subscriptionStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de modifier l'abonnement" });
  }
}

async function resendUserVerification(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isVerified) return res.status(400).json({ error: "Action indisponible" });
    const token = crypto.randomBytes(32).toString("hex");
    user.verifyTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.verifyTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    if (!await sendVerificationEmail({ to: user.email, verificationLink: `${baseUrl}/api/auth/verify-email/${token}` })) return res.status(502).json({ error: "L’e-mail n’a pas pu être envoyé" });
    await recordAuditEvent({ userId: req.user._id, action: "admin.verification_resent", metadata: { targetUserId: user._id.toString(), targetEmail: user.email } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de renvoyer la vérification" });
  }
}

module.exports = { getUserSummary, listUsers, resendUserVerification, updateUserSubscription, updateUserSuspension };
