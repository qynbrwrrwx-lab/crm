// État partagé des documents commerciaux. Charger avant les scripts invoices/.
// Les fonctions restent globales pour les boutons HTML et les écrans existants.
let editingQuoteId = null;
let isEditingQuote = false;
let currentInvoiceId = null;
let currentInvoice = null;
let availableProducts = [];
let allInvoices = [];
const documentActionLocks = new Set();
let paymentInvoiceId = null;
let selectedPaymentMethod = null;
let paymentRemainingAmount = 0;
let quoteProductsById = new Map();
let quoteContactsById = new Map();
