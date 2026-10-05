// Trésorerie : shared.

function treasuryMoney(value) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0)); }

function treasuryDate(value) { return formatDate(value) || "—"; }
