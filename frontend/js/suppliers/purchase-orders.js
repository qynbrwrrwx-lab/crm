// Bons de commande fournisseurs : affichage, impression, création et suivi.
const purchaseOrderStatusLabels = { draft: "Brouillon", sent: "Envoyé", received: "Reçu", cancelled: "Annulé" };

function getPendingPurchaseOrderCount(orders) {
  return orders.filter(order => order.status === "sent").length;
}

function getPurchaseOrderDatesMarkup(order) {
  const sentAt = order.sentAt ? ` · Envoyé le ${new Date(order.sentAt).toLocaleDateString("fr-FR")}` : "";
  const receivedAt = order.stockReceivedAt ? ` · Stock réceptionné le ${new Date(order.stockReceivedAt).toLocaleDateString("fr-FR")}` : "";
  return `${sentAt}${receivedAt}`;
}

function renderPurchaseOrderStatusOptions(order) {
  return Object.entries(purchaseOrderStatusLabels)
    .map(([status, label]) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${label}</option>`)
    .join("");
}

function getPurchaseOrderPresentation(order) {
  return {
    id: order._id,
    number: order.number,
    supplierName: order.supplierId?.name || "Fournisseur",
    lineCount: order.lines?.length || 0,
    dateLabel: getPurchaseOrderDatesMarkup(order),
    canSend: order.status === "draft"
  };
}

function renderPurchaseOrderList(orders) {
  if (!orders.length) return '<article><strong>Aucun bon de commande</strong><small>Créez-en depuis un fournisseur avec des produits à réassortir.</small></article>';
  return orders.map(order => {
    const item = getPurchaseOrderPresentation(order);
    const sendAction = item.canSend ? `<button type="button" class="secondary-btn" onclick="sendPurchaseOrder('${item.id}')">Envoyer</button>` : "";
    return `<article><strong>${escapeHtml(item.number)}</strong><small>${escapeHtml(item.supplierName)} · ${item.lineCount} ligne(s)${item.dateLabel}</small><button type="button" class="secondary-btn" onclick="printPurchaseOrder('${item.id}')">PDF</button>${sendAction}<select onchange="updatePurchaseOrderStatus('${item.id}',this.value)">${renderPurchaseOrderStatusOptions(order)}</select></article>`;
  }).join("");
}

async function renderPurchaseOrders() {
  const list = document.getElementById("suppliersList");
  if (!list || document.getElementById("purchaseOrdersPanel")) return;
  const panel = document.createElement("section");
  panel.id = "purchaseOrdersPanel";
  panel.className = "opportunity-source-insights";
  panel.innerHTML = '<span>Bons de commande fournisseurs</span><div id="purchaseOrdersList"><article><strong>Chargement…</strong></article></div>';
  list.before(panel);
  try {
    const orders = await apiFetch("/api/purchase-orders");
    const pending = getPendingPurchaseOrderCount(orders);
    panel.querySelector("span").textContent = `Bons de commande fournisseurs · ${pending} en attente de réception`;
    window.purchaseOrders = orders;
    document.getElementById("purchaseOrdersList").innerHTML = renderPurchaseOrderList(orders);
  } catch (error) {
    panel.remove();
  }
}

function printPurchaseOrder(id) {
  const order = (window.purchaseOrders || []).find(item => item._id === id);
  if (!order) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return showToast("Autorisez les fenêtres contextuelles.");
  printWindow.document.write(`<h1>Bon de commande ${escapeHtml(order.number)}</h1><h2>${escapeHtml(order.supplierId?.name || "Fournisseur")}</h2><table border="1" cellpadding="8"><tr><th>Produit</th><th>Référence</th><th>Quantité</th></tr>${order.lines.map(line => `<tr><td>${escapeHtml(line.name)}</td><td>${escapeHtml(line.reference || "")}</td><td>${line.quantity}</td></tr>`).join("")}</table><script>print()<\/script>`);
  printWindow.document.close();
}

async function createPurchaseOrderForSupplier(id) {
  const supplier = allSuppliers.find(item => item._id === id);
  const lines = getPurchaseOrderLines(supplier, allProducts || []);
  if (!supplier || !lines.length) return showToast("Aucun réassort à préparer.");
  try {
    await apiFetch("/api/purchase-orders", { method: "POST", body: JSON.stringify({ supplierId: id, lines }) });
    document.getElementById("purchaseOrdersPanel")?.remove();
    await loadSuppliers();
    showToast("Bon de commande créé.");
  } catch (error) {
    showToast(error.message || "Création impossible");
  }
}

async function updatePurchaseOrderStatus(id, status) {
  if (status === "received" && !await confirmAppAction({
    title: "Confirmer la réception",
    message: "Les quantités du bon seront ajoutées au stock une seule fois. Confirmer la réception ?",
    actionLabel: "Réceptionner"
  })) {
    document.getElementById("purchaseOrdersPanel")?.remove();
    return loadSuppliers();
  }
  try {
    await apiFetch(`/api/purchase-orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    document.getElementById("purchaseOrdersPanel")?.remove();
    await loadSuppliers();
    if (status === "received") await loadProducts?.();
    showToast(status === "received" ? "Réception enregistrée et stock mis à jour." : "Statut mis à jour.");
  } catch (error) {
    showToast(error.message || "Mise à jour impossible");
  }
}

async function sendPurchaseOrder(id) {
  try {
    await apiFetch(`/api/purchase-orders/${id}/send`, { method: "POST" });
    document.getElementById("purchaseOrdersPanel")?.remove();
    await loadSuppliers();
    showToast("Bon de commande envoyé au fournisseur.");
  } catch (error) {
    showToast(error.message || "Envoi impossible");
  }
}
