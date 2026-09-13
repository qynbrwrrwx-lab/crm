const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader =
    req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {

    return res.status(401).json({
      error: "Token manquant"
    });
  }

  try {

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

    req.userId =
      decoded.userId;

    next();

  } catch (err) {

    console.error(err);

    return res.status(401).json({
      error: "Token invalide"
    });
  }
};
