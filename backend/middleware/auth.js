const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({
      error: "Token manquant"
    });
  }

  try {

    const token =
      authHeader.split(" ")[1];

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