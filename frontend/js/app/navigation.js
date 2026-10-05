// app : navigation.

function revealAndFocus(selector) {
  const field = document.querySelector(selector);
  if (!field) return;
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => field.focus(), 320);
}

function startContactFromDashboard() {
  showSection("contacts");
  if (typeof cancelContactEdit === "function") cancelContactEdit();
  revealAndFocus("#firstname");
}

function startProductFromDashboard() {
  showSection("products");
  if (typeof cancelProductEdit === "function") cancelProductEdit();
  revealAndFocus("#productName");
}

async function startQuoteFromDashboard() {
  showSection("quotesSection");
  const form = document.getElementById("quoteModal");
  if (form && window.getComputedStyle(form).display === "none" && typeof toggleQuoteForm === "function") {
    await toggleQuoteForm();
  }
  revealAndFocus("#quoteContact");
}
