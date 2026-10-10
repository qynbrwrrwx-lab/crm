// Tableau de bord : alerts.

async function updateElectronicInvoicingAlert(invoices) {
  const label = document.getElementById("dashboardElectronicAlertLabel");
  const detail = document.getElementById("dashboardElectronicAlertDetail");
  const button = document.getElementById("dashboardElectronicAlertButton");
  const dot = document.getElementById("dashboardElectronicAlertDot");
  if (!label || !detail || !button) return;

  const prepared = invoices.filter(invoice => invoice.electronicTransmission?.status === "ready").length;
  try {
    const status = await apiFetch("/api/electronic-invoicing/status");
    if (!status.enabled || !status.identityComplete) {
      label.textContent = "Facturation électronique à préparer";
      detail.textContent = status.missingFields?.length
        ? `À compléter : ${status.missingFields.slice(0, 2).join(" · ")}${status.missingFields.length > 2 ? "…" : ""}`
        : "Activez la préparation depuis le profil de votre entreprise.";
      button.textContent = "Préparer";
      button.onclick = () => showSection("company");
      dot?.classList.remove("is-ready");
      return;
    }

    label.textContent = prepared
      ? `${prepared} facture${prepared > 1 ? "s" : ""} prête${prepared > 1 ? "s" : ""} à transmettre`
      : "Facturation électronique préparée";
    detail.textContent = status.providerName
      ? `Plateforme envisagée : ${status.providerName}. Connecteur en attente d’activation.`
      : "Choisissez une plateforme agréée lorsque votre connecteur sera disponible.";
    button.textContent = prepared ? "Voir" : "Configurer";
    button.onclick = () => {
      if (prepared) {
        showSection("invoicesSection");
        setElectronicInvoiceQuickFilter("ready");
      } else {
        showSection("company");
      }
    };
    dot?.classList.add("is-ready");
  } catch (err) {
    console.warn("Alerte facturation électronique indisponible", err);
  }
}

function getClientFollowUpAlertPresentation(contacts, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = contacts
    .filter(contact => contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) <= today)
    .sort((left, right) => new Date(left.nextFollowUpAt) - new Date(right.nextFollowUpAt));
  if (!due.length) {
    return {
      label: "Aucune relance client à prévoir",
      detail: "Planifiez une prochaine relance depuis une fiche client.",
      buttonLabel: "Clients",
      contactId: null
    };
  }
  const first = due[0];
  const name = first.companyName || `${first.firstname || ""} ${first.lastname || ""}`.trim() || "Client";
  return {
    label: `${due.length} relance${due.length > 1 ? "s" : ""} client à effectuer`,
    detail: `Priorité : ${name}.`,
    buttonLabel: "Voir",
    contactId: first._id
  };
}

function updateClientFollowUpAlert(contacts) {
  const label = document.getElementById("dashboardFollowUpAlertLabel");
  const detail = document.getElementById("dashboardFollowUpAlertDetail");
  const button = document.getElementById("dashboardFollowUpAlertButton");
  const dot = document.getElementById("dashboardFollowUpAlertDot");
  if (!label || !detail || !button) return;

  const presentation = getClientFollowUpAlertPresentation(contacts);
  label.textContent = presentation.label;
  detail.textContent = presentation.detail;
  button.textContent = presentation.buttonLabel;
  if (!presentation.contactId) {
    button.onclick = () => showSection("contacts");
    dot?.classList.remove("is-due");
    return;
  }
  button.onclick = () => {
    showSection("contacts");
    openClientProfile(presentation.contactId);
  };
  dot?.classList.add("is-due");
}
