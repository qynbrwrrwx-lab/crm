const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const emailService = require("../../services/emailService");
const { recordAuditEvent } = require("../../services/auditService");
const { createExpiringToken, getPublicBaseUrl, isValidPassword } = require("../../services/authSecurityService");

async function register(req, res) {
  try {
    let { email, password } = req.body;
    if (typeof email !== "string" || !isValidPassword(password)) {
      return res.status(400).json({ error: "Utilisez un email valide et un mot de passe d'au moins 12 caractères" });
    }

    email = email.toLowerCase().trim();
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const hash = await bcrypt.hash(password, 10);
    const verification = createExpiringToken();
    await User.create({
      email,
      password: hash,
      verifyTokenHash: verification.hash,
      verifyTokenExpiresAt: verification.expiresAt,
      isVerified: false
    });

    const verificationEmailSent = await emailService.sendVerificationEmail({
      to: email,
      verificationLink: `${getPublicBaseUrl(req)}/api/auth/verify-email/${verification.token}`
    });
    return res.json({
      success: true,
      verificationEmailSent,
      message: verificationEmailSent
        ? "Compte créé. Vérifiez votre boîte e-mail."
        : "Compte créé, mais l'e-mail de vérification n'a pas pu être envoyé. Renvoyez le lien depuis la connexion."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur inscription" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: "Compte introuvable" });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }
    if (user.isSuspended) {
      return res.status(403).json({ error: "Ce compte est suspendu. Contactez le support." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: "Veuillez vérifier votre adresse email avant de vous connecter" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    await recordAuditEvent({ userId: user._id, action: "user.login" });
    return res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

function validateSession(req, res) {
  return res.json({ success: true });
}

module.exports = { register, login, validateSession };
