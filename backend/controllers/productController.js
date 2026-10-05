// Façade des routes Produits : catalogue et stock sont séparés par responsabilité.
module.exports = {
  ...require("./product/catalog"),
  ...require("./product/stock")
};
