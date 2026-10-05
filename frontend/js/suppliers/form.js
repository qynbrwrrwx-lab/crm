// suppliers : form.

async function saveSupplier(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById("supplierName")?.value.trim(),
    contactName: document.getElementById("supplierContactName")?.value.trim(),
    email: document.getElementById("supplierEmail")?.value.trim(),
    phone: document.getElementById("supplierPhone")?.value.trim(),
    notes: document.getElementById("supplierNotes")?.value.trim()
  };
  if (!payload.name) return showToast("Le nom du fournisseur est obligatoire");
  try {
    const endpoint = editingSupplierId ? `/api/suppliers/${editingSupplierId}` : "/api/suppliers";
    await apiFetch(endpoint, { method: editingSupplierId ? "PUT" : "POST", body: JSON.stringify(payload) });
    const wasEditing = Boolean(editingSupplierId);
    cancelSupplierEdit();
    showToast(wasEditing ? "Fournisseur mis à jour" : "Fournisseur ajouté");
    await loadSuppliers();
  } catch (error) { showToast(error.message || "Impossible d'enregistrer le fournisseur"); }
}

function editSupplier(id) {
  const supplier = allSuppliers.find(item => item._id === id);
  if (!supplier) return;
  editingSupplierId = id;
  document.getElementById("supplierName").value = supplier.name || "";
  document.getElementById("supplierContactName").value = supplier.contactName || "";
  document.getElementById("supplierEmail").value = supplier.email || "";
  document.getElementById("supplierPhone").value = supplier.phone || "";
  document.getElementById("supplierNotes").value = supplier.notes || "";
  document.getElementById("supplierFormTitle").textContent = "Modifier le fournisseur";
  document.getElementById("supplierSubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelSupplierEditButton").hidden = false;
  document.getElementById("supplierForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelSupplierEdit() {
  editingSupplierId = null;
  document.getElementById("supplierForm")?.reset();
  document.getElementById("supplierFormTitle").textContent = "Ajouter un fournisseur";
  document.getElementById("supplierSubmitButton").textContent = "Ajouter le fournisseur";
  document.getElementById("cancelSupplierEditButton").hidden = true;
}

function startExpenseForSupplier(id) {
  const supplier = allSuppliers.find(item => item._id === id);
  if (!supplier) return;
  showSection("expensesSection");
  cancelExpenseEdit?.();
  const input = document.getElementById("expenseSupplier");
  if (input) {
    input.value = supplier.name;
    showExpenseSupplierDetails?.();
    document.getElementById("expenseLabel")?.focus();
  }
}
