// Façade des routes Tâches : cycle de vie et confirmation de rendez-vous.
module.exports = {
  ...require("./task/lifecycle"),
  ...require("./task/appointment-email")
};
