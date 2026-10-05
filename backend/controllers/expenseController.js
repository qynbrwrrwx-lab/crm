// Façade des routes Dépenses : catalogue et règlement.
module.exports = {
  ...require("./expense/catalog"),
  ...require("./expense/payment")
};
