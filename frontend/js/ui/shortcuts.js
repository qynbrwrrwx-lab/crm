// Interface : initialisation visuelle et raccourcis clavier.

document.addEventListener("DOMContentLoaded", () => {
  const today = document.getElementById("appToday");
  if (today) today.textContent = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  });
  try {
    if (localStorage.getItem("my-prospect-sidebar-collapsed") === "true") {
      document.querySelector(".app-layout")?.classList.add("sidebar-collapsed");
    }
  } catch (error) {}
});

function isVisibleModal(id) {
  const modal = document.getElementById(id);
  return Boolean(modal && window.getComputedStyle(modal).display !== "none");
}

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const closers = [
    ["addProductModal", "closeAddProductModal", []],
    ["paymentModal", "closePaymentModal", []],
    ["restockModal", "closeRestockModal", []],
    ["appConfirmModal", "closeAppConfirmation", [false]],
    ["passwordChangeModal", "closePasswordChangeModal", []],
    ["invoiceDetailsModal", "closeInvoiceDetails", []],
    ["quoteModal", "closeQuoteModal", []]
  ];
  const target = closers.find(([id, name]) => isVisibleModal(id) && typeof window[name] === "function");
  if (target) window[target[1]](...target[2]);
});
