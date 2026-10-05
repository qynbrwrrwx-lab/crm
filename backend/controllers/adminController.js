const dashboard = require("./admin/dashboard");
const subscriptions = require("./admin/subscription-invoices");
const users = require("./admin/users");

module.exports = {
  ...dashboard,
  ...subscriptions,
  ...users
};
