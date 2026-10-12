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

function getPurchaseOrderStatusOptionsPresentation(order) {
  return Object.entries(purchaseOrderStatusLabels)
    .map(([value, label]) => ({ value, label, selected: order.status === value }));
}

function renderPurchaseOrderStatusOptions(options) {
  return options.map(option => `<option value="${option.value}" ${option.selected ? "selected" : ""}>${option.label}</option>`).join("");
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

function getPurchaseOrderListPresentation(orders) {
  const pendingCount = getPendingPurchaseOrderCount(orders);
  return {
    heading: `Bons de commande fournisseurs · ${pendingCount} en attente de réception`,
    emptyTitle: "Aucun bon de commande",
    emptyDetail: "Créez-en depuis un fournisseur avec des produits à réassortir.",
    items: orders.map(order => ({
      ...getPurchaseOrderPresentation(order),
      statusOptions: getPurchaseOrderStatusOptionsPresentation(order)
    }))
  };
}

function renderPurchaseOrderList(orders) {
  const presentation = getPurchaseOrderListPresentation(orders);
  if (!presentation.items.length) return `<article><strong>${presentation.emptyTitle}</strong><small>${presentation.emptyDetail}</small></article>`;
  return presentation.items.map(item => {
    const sendAction = item.canSend ? `<button type="button" class="secondary-btn" onclick="sendPurchaseOrder('${item.id}')">Envoyer</button>` : "";
    return `<article><strong>${escapeHtml(item.number)}</strong><small>${escapeHtml(item.supplierName)} · ${item.lineCount} ligne(s)${item.dateLabel}</small><button type="button" class="secondary-btn" onclick="printPurchaseOrder('${item.id}')">PDF</button>${sendAction}<select onchange="updatePurchaseOrderStatus('${item.id}',this.value)">${renderPurchaseOrderStatusOptions(item.statusOptions)}</select></article>`;
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
    panel.querySelector("span").textContent = getPurchaseOrderListPresentation(orders).heading;
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

function getPurchaseOrderStatusPresentation(status) {
  if (status === "received") {
    return {
      confirmation: {
        title: "Confirmer la réception",
        message: "Les quantités du bon seront ajoutées au stock une seule fois. Confirmer la réception ?",
        actionLabel: "Réceptionner"
      },
      successMessage: "Réception enregistrée et stock mis à jour."
    };
  }
  return { confirmation: null, successMessage: "Statut mis à jour." };
}

async function updatePurchaseOrderStatus(id, status) {
  const presentation = getPurchaseOrderStatusPresentation(status);
  if (presentation.confirmation && !await confirmAppAction(presentation.confirmation)) {
    document.getElementById("purchaseOrdersPanel")?.remove();
    return loadSuppliers();
  }
  try {
    await apiFetch(`/api/purchase-orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    document.getElementById("purchaseOrdersPanel")?.remove();
    await loadSuppliers();
    if (status === "received") await loadProducts?.();
    showToast(presentation.successMessage);
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
