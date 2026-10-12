// Opportunités : formulaire, préremplissage et enregistrement.

const opportunitySourceOptions = [
  ["manual", "Saisie manuelle"],
  ["website", "Site internet"],
  ["referral", "Recommandation"],
  ["network", "Réseau / salon"],
  ["advertising", "Publicité"],
  ["other", "Autre"]
];

function getOpportunityFormModePresentation(isEditing) {
  return isEditing
    ? { title: "Modifier l’opportunité", submitLabel: "Enregistrer les modifications", cancelHidden: false }
    : { title: "Ajouter une opportunité", submitLabel: "Ajouter au pipeline", cancelHidden: true };
}

function getOpportunityFormOptionsPresentation() {
  return {
    sourceOptions: opportunitySourceOptions.map(([value, label]) => ({ value, label })),
    lostReasonOptions: Object.entries(opportunityLostReasons).map(([value, label]) => ({ value, label }))
  };
}

function opportunityContacts() {
  const select = document.getElementById("opportunityContact");
  if (!select || typeof allContacts === "undefined") return;

  const value = select.value;
  const options = allContacts
    .map(contact => `<option value="${contact._id}">${escapeHtml(contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client")}</option>`)
    .join("");
  select.innerHTML = '<option value="">Non rattaché</option>' + options;
  select.value = value;
}

function ensureOpportunitySourceField() {
  if (document.getElementById("opportunitySource")) return;
  const stage = document.getElementById("opportunityStage")?.closest("label");
  if (!stage) return;

  const options = getOpportunityFormOptionsPresentation().sourceOptions
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join("");
  stage.insertAdjacentHTML("beforebegin", `<label class="form-field"><span>Origine</span><select id="opportunitySource">${options}</select></label>`);
}

function ensureOpportunityLostReasonField() {
  if (document.getElementById("opportunityLostReason")) return;
  const stage = document.getElementById("opportunityStage")?.closest("label");
  if (!stage) return;

  const options = getOpportunityFormOptionsPresentation().lostReasonOptions
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join("");
  stage.insertAdjacentHTML("afterend", `<label class="form-field" id="opportunityLostReasonField" hidden><span>Motif de perte</span><select id="opportunityLostReason"><option value="">Non renseigné</option>${options}</select></label>`);
}

function toggleOpportunityLostReason() {
  ensureOpportunityLostReasonField();
  const field = document.getElementById("opportunityLostReasonField");
  if (field) field.hidden = document.getElementById("opportunityStage")?.value !== "lost";
}

function suggestOpportunityProbability() {
  const stage = document.getElementById("opportunityStage")?.value;
  const field = document.getElementById("opportunityProbability");
  if (field && Object.hasOwn(opportunityStageProbability, stage)) field.value = opportunityStageProbability[stage];
}

function setOpportunityFormMode(isEditing) {
  const presentation = getOpportunityFormModePresentation(isEditing);
  document.getElementById("opportunityFormTitle").textContent = presentation.title;
  document.getElementById("opportunitySubmitButton").textContent = presentation.submitLabel;
  document.getElementById("opportunityCancelEdit").hidden = presentation.cancelHidden;
}

function resetOpportunityForm() {
  const form = document.getElementById("opportunityForm");
  if (!form) return;

  form.reset();
  document.getElementById("opportunityEditId").value = "";
  setOpportunityFormMode(false);
  toggleOpportunityLostReason();
}

function getOpportunityContactId(contact) {
  return contact?._id || contact || "";
}

function populateOpportunityForm(item) {
  document.getElementById("opportunityEditId").value = item._id;
  document.getElementById("opportunityTitle").value = item.title || "";
  document.getElementById("opportunityContact").value = getOpportunityContactId(item.contactId);
  document.getElementById("opportunityAmount").value = item.amount || "";
  document.getElementById("opportunityProbability").value = item.probability ?? 20;
  document.getElementById("opportunitySource").value = item.source || "manual";
  document.getElementById("opportunityStage").value = item.stage || "lead";
  document.getElementById("opportunityLostReason").value = item.lostReason || "";
  document.getElementById("opportunityCloseDate").value = item.expectedCloseDate ? new Date(item.expectedCloseDate).toISOString().slice(0, 10) : "";
  document.getElementById("opportunityNotes").value = item.notes || "";
}

function editOpportunity(id) {
  const item = allOpportunities.find(entry => entry._id === id);
  if (!item) return;

  ensureOpportunitySourceField();
  ensureOpportunityLostReasonField();
  populateOpportunityForm(item);
  toggleOpportunityLostReason();
  setOpportunityFormMode(true);
  document.getElementById("opportunityForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveOpportunity(event) {
  event.preventDefault();
  ensureOpportunitySourceField();
  ensureOpportunityLostReasonField();

  const id = document.getElementById("opportunityEditId").value;
  const payload = getOpportunityFormData();
  try {
    await apiFetch(`/api/opportunities${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    resetOpportunityForm();
    showToast(id ? "Opportunité modifiée" : "Opportunité ajoutée");
    await loadOpportunities();
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById("opportunityStage")?.addEventListener("change", ()=>{suggestOpportunityProbability();toggleOpportunityLostReason();});
