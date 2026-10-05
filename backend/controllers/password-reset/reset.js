const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const { hashToken, isValidPassword } = require("../../services/authSecurityService");

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 12 caractères" });
    }

    const user = await User.findOne({
      resetTokenHash: hashToken(req.params.token),
      resetTokenExpiresAt: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ error: "Token invalide" });

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();
    return res.json({ success: true, message: "Mot de passe modifié" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { resetPassword };
