// API et états partagés. Voir app/README.md.
const API_URL = window.MY_PROSPECT_API_URL || window.location.origin;
let map;
let markers = [];
let chart;
let analyticsChart;
let globalSearchResults = [];
let globalSearchSelectedIndex = -1;
let appConfirmationResolver = null;
let appConfirmationRequiresPassword = false;
