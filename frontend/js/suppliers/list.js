// suppliers : list.

function getSupplierLookupName(name) {
  return String(name || "").toLocaleLowerCase("fr-FR");
}

function getSupplierUsage(supplier, products = [], expenses = []) {
  const supplierName = getSupplierLookupName(supplier.name);
  const relatedProducts = products.filter(product => getSupplierLookupName(product.supplierName) === supplierName);
  return {
    products: relatedProducts,
    urgentProducts: relatedProducts.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5)),
    expenses: expenses.filter(expense => getSupplierLookupName(expense.supplier) === supplierName)
  };
}

function selectSuppliers(suppliers, query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
  return suppliers.filter(supplier => [supplier.name, supplier.contactName, supplier.email, supplier.phone, supplier.notes]
    .join(" ")
    .toLocaleLowerCase("fr-FR")
    .includes(normalizedQuery));
}

function getSupplierCardPresentation(supplier, products = [], expenses = []) {
  const usage = getSupplierUsage(supplier, products, expenses);
  const urgentProductCount = usage.urgentProducts.length;
  return {
    id: supplier._id,
    initial: supplier.name.slice(0, 1).toUpperCase(),
    name: supplier.name,
    contactName: supplier.contactName || "Interlocuteur non renseigné",
    productLabel: `${usage.products.length} produit${usage.products.length > 1 ? "s" : ""}`,
    expenseLabel: `${usage.expenses.length} dépense${usage.expenses.length > 1 ? "s" : ""}`,
    restockLabel: urgentProductCount ? `${urgentProductCount} produit${urgentProductCount > 1 ? "s" : ""} à réassortir` : "",
    lastRestockLabel: supplier.lastRestockRequestAt ? `Dernière demande de réassort : ${new Date(supplier.lastRestockRequestAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}` : "",
    notes: supplier.notes || "",
    email: supplier.email || "",
    phone: supplier.phone || "",
    canCreatePurchaseOrder: Boolean(urgentProductCount),
    canRequestRestock: Boolean(supplier.email && urgentProductCount)
  };
}

function renderSuppliers() {
  const list = document.getElementById("suppliersList");
  const count = document.getElementById("suppliersCount");
  if (!list) return;
  const suppliers = selectSuppliers(allSuppliers, document.getElementById("suppliersFilter")?.value || "");
  const products = typeof allProducts === "undefined" ? [] : allProducts;
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  if (count) count.textContent = `${allSuppliers.length} fournisseur${allSuppliers.length > 1 ? "s" : ""}`;
  if (!suppliers.length) {
    list.innerHTML = `<p class="empty-state">${allSuppliers.length ? "Aucun fournisseur ne correspond à votre recherche." : "Aucun fournisseur enregistré pour le moment."}</p>`;
    return;
  }
  list.innerHTML = suppliers.map(supplier => {
    const item = getSupplierCardPresentation(supplier, products, expenses);
    return `<article class="supplier-card">
    <div class="supplier-avatar">${escapeHtml(item.initial)}</div>
    <div class="supplier-main"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.contactName)}</p><span class="supplier-usage">${item.productLabel} · ${item.expenseLabel}</span>${item.restockLabel ? `<small class="client-follow-up is-overdue">${item.restockLabel}</small>` : ""}${item.lastRestockLabel ? `<small>${item.lastRestockLabel}</small>` : ""}${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}</div>
    <div class="supplier-contact">${item.email ? `<a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a>` : ""}${item.phone ? `<a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a>` : ""}</div>
    <div class="expense-actions">${item.canCreatePurchaseOrder ? `<button type="button" class="expense-text-action supplier-add-expense" onclick="createPurchaseOrderForSupplier('${item.id}')">Créer un bon de commande</button>` : ""}${item.canRequestRestock ? `<button type="button" class="expense-text-action supplier-add-expense" onclick="sendRestockRequest('${item.id}')">Demander le réassort</button>` : ""}<button type="button" class="expense-text-action supplier-add-expense" onclick="startExpenseForSupplier('${item.id}')">Ajouter une dépense</button><button type="button" class="expense-text-action" onclick="editSupplier('${item.id}')">Modifier</button><button type="button" class="expense-text-action danger" onclick="deleteSupplier('${item.id}')">Supprimer</button></div>
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
