const User = require("../../models/user");
const emailService = require("../../services/emailService");
const { createExpiringToken, getPublicBaseUrl } = require("../../services/authSecurityService");

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email requis" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const reset = createExpiringToken();
    user.resetTokenHash = reset.hash;
    user.resetTokenExpiresAt = reset.expiresAt;
    await user.save();

    const resetEmailSent = await emailService.sendResetEmail({
      to: normalizedEmail,
      resetLink: `${getPublicBaseUrl(req)}/reset-password/${reset.token}`
    });
    if (!resetEmailSent) {
      return res.status(503).json({ error: "L'e-mail de réinitialisation n'a pas pu être envoyé. Réessayez dans quelques instants." });
    }
    return res.json({ success: true, message: "Email reset envoyé" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { requestPasswordReset };
