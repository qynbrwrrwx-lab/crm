// suppliers : list.

function renderSuppliers() {
  const list = document.getElementById("suppliersList");
  const count = document.getElementById("suppliersCount");
  if (!list) return;
  const query = document.getElementById("suppliersFilter")?.value.trim().toLocaleLowerCase("fr-FR") || "";
  const suppliers = allSuppliers.filter(supplier => [supplier.name, supplier.contactName, supplier.email, supplier.phone, supplier.notes].join(" ").toLocaleLowerCase("fr-FR").includes(query));
  if (count) count.textContent = `${allSuppliers.length} fournisseur${allSuppliers.length > 1 ? "s" : ""}`;
  if (!suppliers.length) {
    list.innerHTML = `<p class="empty-state">${allSuppliers.length ? "Aucun fournisseur ne correspond à votre recherche." : "Aucun fournisseur enregistré pour le moment."}</p>`;
    return;
  }
  list.innerHTML = suppliers.map(supplier => {
    const supplierName = supplier.name.toLocaleLowerCase("fr-FR");
    const products = (typeof allProducts === "undefined" ? [] : allProducts).filter(product => String(product.supplierName || "").toLocaleLowerCase("fr-FR") === supplierName);
    const urgentProducts = products.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
    const expenses = (typeof allExpenses === "undefined" ? [] : allExpenses).filter(expense => String(expense.supplier || "").toLocaleLowerCase("fr-FR") === supplierName);
    return `<article class="supplier-card">
    <div class="supplier-avatar">${escapeHtml(supplier.name.slice(0, 1).toUpperCase())}</div>
    <div class="supplier-main"><h3>${escapeHtml(supplier.name)}</h3><p>${escapeHtml(supplier.contactName || "Interlocuteur non renseigné")}</p><span class="supplier-usage">${products.length} produit${products.length > 1 ? "s" : ""} · ${expenses.length} dépense${expenses.length > 1 ? "s" : ""}</span>${urgentProducts.length ? `<small class="client-follow-up is-overdue">${urgentProducts.length} produit${urgentProducts.length > 1 ? "s" : ""} à réassortir</small>` : ""}${supplier.lastRestockRequestAt ? `<small>Dernière demande de réassort : ${new Date(supplier.lastRestockRequestAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</small>` : ""}${supplier.notes ? `<small>${escapeHtml(supplier.notes)}</small>` : ""}</div>
    <div class="supplier-contact">${supplier.email ? `<a href="mailto:${escapeHtml(supplier.email)}">${escapeHtml(supplier.email)}</a>` : ""}${supplier.phone ? `<a href="tel:${escapeHtml(supplier.phone)}">${escapeHtml(supplier.phone)}</a>` : ""}</div>
    <div class="expense-actions">${urgentProducts.length ? `<button type="button" class="expense-text-action supplier-add-expense" onclick="createPurchaseOrderForSupplier('${supplier._id}')">Créer un bon de commande</button>` : ""}${supplier.email && urgentProducts.length ? `<button type="button" class="expense-text-action supplier-add-expense" onclick="sendRestockRequest('${supplier._id}')">Demander le réassort</button>` : ""}<button type="button" class="expense-text-action supplier-add-expense" onclick="startExpenseForSupplier('${supplier._id}')">Ajouter une dépense</button><button type="button" class="expense-text-action" onclick="editSupplier('${supplier._id}')">Modifier</button><button type="button" class="expense-text-action danger" onclick="deleteSupplier('${supplier._id}')">Supprimer</button></div>
  </article>`;
  }).join("");
}

function syncSupplierSuggestions() {
  const options = allSuppliers.map(supplier => `<option value="${escapeHtml(supplier.name)}">${escapeHtml(supplier.contactName || supplier.email || "Fournisseur enregistré")}</option>`).join("");
  const expenseSuggestions = document.getElementById("expenseSupplierSuggestions");
  const productSuggestions = document.getElementById("productSupplierSuggestions");
  if (expenseSuggestions) expenseSuggestions.innerHTML = options;
  if (productSuggestions) productSuggestions.innerHTML = options;
  showExpenseSupplierDetails?.();
}

async function loadSuppliers() {
  try { allSuppliers = await apiFetch("/api/suppliers"); renderSuppliers(); renderPurchaseOrders(); syncSupplierSuggestions(); } catch (error) { console.error("Impossible de charger les fournisseurs", error); }
}
