// Façade des routes Fournisseurs : gestion et demandes de réassort.
module.exports = {
  ...require("./supplier/crud"),
  ...require("./supplier/restock-request")
};
