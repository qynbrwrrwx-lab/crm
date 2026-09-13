const jwt = require("jsonwebtoken");

const User = require("../models/user");

module.exports = async (req, res, next) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {

      return res.status(401).json({
        error: "Token manquant"
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        error: "Token manquant"
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {

      return res.status(401).json({
        error: "Utilisateur introuvable"
      });
    }

    req.user = user;

    next();

  } catch (err) {

    console.error(err);

    return res.status(401).json({
      error: "Token invalide"
    });
  }
};
