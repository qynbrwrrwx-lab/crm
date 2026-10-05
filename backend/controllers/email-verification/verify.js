const User = require("../../models/user");
const { getPublicBaseUrl, hashToken } = require("../../services/authSecurityService");

async function verifyEmail(req, res) {
  try {
    const user = await User.findOne({
      verifyTokenHash: hashToken(req.params.token),
      verifyTokenExpiresAt: { $gt: new Date() }
    });
    if (!user || user.isVerified) {
      return res.redirect(`${getPublicBaseUrl(req)}/verify-email-already`);
    }

    user.isVerified = true;
    user.verifyTokenHash = null;
    user.verifyTokenExpiresAt = null;
    await user.save();
    return res.redirect(`${getPublicBaseUrl(req)}/verify-email-success`);
  } catch (error) {
    console.error(error);
    return res.redirect(`${getPublicBaseUrl(req)}/verify-email-error`);
  }
}

module.exports = { verifyEmail };
