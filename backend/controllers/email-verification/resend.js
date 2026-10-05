const User = require("../../models/user");
const emailService = require("../../services/emailService");
const { createExpiringToken, getPublicBaseUrl } = require("../../services/authSecurityService");

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email requis" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isVerified) return res.json({ success: true });

    const verification = createExpiringToken();
    user.verifyTokenHash = verification.hash;
    user.verifyTokenExpiresAt = verification.expiresAt;
    await user.save();

    const verificationEmailSent = await emailService.sendVerificationEmail({
      to: normalizedEmail,
      verificationLink: `${getPublicBaseUrl(req)}/api/auth/verify-email/${verification.token}`
    });
    if (!verificationEmailSent) {
      return res.status(503).json({ error: "L'e-mail de vérification n'a pas pu être envoyé. Réessayez dans quelques instants." });
    }
    return res.json({ success: true, message: "Email validation renvoyé" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { resendVerification };
