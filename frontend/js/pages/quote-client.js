const quoteToken = location.pathname.split("/").filter(Boolean).pop();

function formatQuoteAmount(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} €`;
}

function escapeQuoteHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value || "");
  return element.innerHTML;
}

function quoteApp() {
  return document.getElementById("app");
}

function setQuoteLoading(isLoading) {
  quoteApp()?.setAttribute("aria-busy", String(isLoading));
}

function renderQuoteMessage(title, message) {
  quoteApp().innerHTML = `
    <div class="message" role="status">
      <h1>${escapeQuoteHtml(title)}</h1>
      <p>${escapeQuoteHtml(message)}</p>
    </div>`;
}

function bindQuoteResponseButtons() {
  document.querySelectorAll("[data-quote-response]").forEach(button => {
    button.addEventListener("click", () => respondToQuote(button.dataset.quoteResponse));
  });
}

function renderQuote(data) {
  const { company, quote, client } = data;
  const accepted = quote.status === "accepted";
  document.title = `Devis ${quote.number}`;
  document.getElementById("brand").textContent = company.name;

  quoteApp().innerHTML = `
    <div class="head">
      <div>
        <div class="eyebrow">Proposition commerciale</div>
        <h1>Devis ${escapeQuoteHtml(quote.number)}</h1>
        <span>Émis le ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}</span>
      </div>
      <span class="status">${accepted ? "Devis accepté" : "En attente de validation"}</span>
    </div>
    <div class="client"><span>Destinataire</span><strong>${escapeQuoteHtml(client.name)}</strong></div>
    <table>
      <thead><tr><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead>
      <tbody>${quote.products.map(product => `
        <tr>
          <td>${escapeQuoteHtml(product.name)}</td>
          <td>${Number(product.quantity || 0)}</td>
          <td>${formatQuoteAmount(product.unitHT)}</td>
          <td>${formatQuoteAmount(product.lineHT)}</td>
        </tr>`).join("")}</tbody>
    </table>
    <div class="totals">
      <div class="total">
        <div><span>Total HT</span><span>${formatQuoteAmount(quote.totalHT)}</span></div>
        <div><strong>Total TTC</strong><strong>${formatQuoteAmount(quote.totalTTC)}</strong></div>
      </div>
    </div>
    ${accepted
      ? '<div class="note">Ce devis a déjà été accepté. Merci pour votre confiance.</div>'
      : `<div class="action">
          <button class="button secondary" type="button" data-quote-response="decline">Refuser</button>
          <button class="button" type="button" data-quote-response="accept">Accepter ce devis</button>
        </div>
        <div class="note">Votre réponse sera transmise immédiatement à l'entreprise.</div>`}`;

  bindQuoteResponseButtons();
}

async function loadQuote() {
  setQuoteLoading(true);
  try {
    const response = await fetch(`/api/public/quotes/${encodeURIComponent(quoteToken)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    renderQuote(data);
  } catch (error) {
    renderQuoteMessage("Lien indisponible", error.message || "Ce devis ne peut pas être consulté.");
  } finally {
    setQuoteLoading(false);
  }
}

function setQuoteResponseButtonsDisabled(disabled) {
  document.querySelectorAll("[data-quote-response]").forEach(button => {
    button.disabled = disabled;
  });
}

async function respondToQuote(action) {
  const isDecline = action === "decline";
  let reason = "";

  if (isDecline) {
    reason = prompt("Indiquez éventuellement le motif de votre refus (facultatif) :") ?? "";
    if (!confirm("Confirmez-vous le refus de ce devis ?")) return;
  } else if (!confirm("Confirmez-vous l’acceptation de ce devis ?")) {
    return;
  }

  setQuoteResponseButtonsDisabled(true);
  try {
    const response = await fetch(`/api/public/quotes/${encodeURIComponent(quoteToken)}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: isDecline ? JSON.stringify({ reason }) : undefined
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    renderQuoteMessage(
      isDecline ? "Réponse enregistrée" : "Devis accepté",
      isDecline
        ? `Votre refus du devis ${data.number} a bien été transmis.`
        : `Merci, votre acceptation du devis ${data.number} a bien été enregistrée.`
    );
  } catch (error) {
    alert(error.message);
    setQuoteResponseButtonsDisabled(false);
  }
}

loadQuote();
