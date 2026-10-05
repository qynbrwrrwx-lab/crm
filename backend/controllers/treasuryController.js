// Façade des routes Trésorerie : paramètres, mouvements et imports.
module.exports = {
  ...require("./treasury/settings"),
  ...require("./treasury/entries"),
  ...require("./treasury/import")
};
