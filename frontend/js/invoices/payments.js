// Documents commerciaux : payments. Voir README.md pour les responsabilités.

async function markInvoicePaid(id) {
  try {
    const invoices = await apiFetch("/api/invoices");
    const invoice = invoices.find(item => item._id === id);

    if (!invoice || invoice.type !== "invoice") {
      throw new Error("Facture introuvable");
    }

    paymentInvoiceId = id;
    selectedPaymentMethod = null;
    paymentRemainingAmount = getInvoiceRemainingAmount(invoice);

    document.getElementById("paymentInvoiceNumber").textContent =
      `Facture ${invoice.invoiceNumber}`;
    document.getElementById("paymentInvoiceAmount").textContent =
      `${paymentRemainingAmount.toFixed(2)} € TTC`;
    const paymentAmountInput = document.getElementById("paymentAmountInput");
    if (paymentAmountInput) { paymentAmountInput.value = paymentRemainingAmount.toFixed(2); paymentAmountInput.max = paymentRemainingAmount.toFixed(2); }
    document.querySelectorAll(".payment-method-btn").forEach(button => {
      button.classList.remove("selected");
    });

    document.getElementById("paymentModal").style.display = "flex";
  } catch (err) {
    console.error(err);
    showToast(err.message || "Impossible d'ouvrir le paiement");
  }
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;

  document.querySelectorAll(".payment-method-btn").forEach(button => {
    button.classList.toggle("selected", button.dataset.method === method);
  });
}

function closePaymentModal() {
  paymentInvoiceId = null;
  selectedPaymentMethod = null;
  paymentRemainingAmount = 0;

  const modal = document.getElementById("paymentModal");
  if (modal) modal.style.display = "none";
}

async function confirmInvoicePayment() {
  if (!paymentInvoiceId || !selectedPaymentMethod) {
    showToast("Sélectionnez un moyen de paiement");
    return;
  }

  const invoiceId = paymentInvoiceId;
  const paymentMethod = selectedPaymentMethod;
  const amount = Number(document.getElementById("paymentAmountInput")?.value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > paymentRemainingAmount + 0.001) { showToast("Saisissez un montant valide"); return; }
  const lockKey = `payment:${invoiceId}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  const confirmButton = document.getElementById("confirmPaymentButton");
  const originalLabel = confirmButton?.textContent;
  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.classList.add("is-loading");
    confirmButton.textContent = "Enregistrement…";
  }

  try {
    const updatedInvoice = await apiFetch(
      `/api/invoices/pay/${invoiceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ paymentMethod, amount })
      }
    );

    const remainingAmount = getInvoiceRemainingAmount(updatedInvoice);
    currentInvoice = structuredClone(updatedInvoice);
    await loadInvoices();
    closePaymentModal();

    if (currentInvoiceId === invoiceId) {
      await openInvoice(invoiceId);
    }

    showToast(updatedInvoice.paymentStatus === "paid" ? `Facture payée · ${paymentMethod} ✅` : `Règlement partiel enregistré · reste ${remainingAmount.toFixed(2)} €`);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Erreur lors du paiement");
  } finally {
    documentActionLocks.delete(lockKey);
    if (confirmButton) {
      confirmButton.disabled = false;
      confirmButton.classList.remove("is-loading");
      confirmButton.textContent = originalLabel || "Confirmer le paiement";
    }
  }
}

async function createCreditNote(id) {
  if (!await confirmAppAction({ title: "Créer un avoir ?", message: "Un avoir correspondant à cette facture sera créé. Cette opération est définitive.", actionLabel: "Créer l’avoir", danger: true })) return;
  const lockKey = `credit-note:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "credit-note", true, "Création…");
  try {
    const creditNote = await apiFetch(`/api/invoices/credit-note/${id}`, { method: "POST" });
    await loadInvoices();
    showToast(`Avoir ${creditNote.invoiceNumber} créé ✅`);
    await openInvoice(creditNote._id);
  } catch (err) {
    showToast(err.message || "Impossible de créer l'avoir");
  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "credit-note", false);
  }
}

async function createDepositInvoice(id) {
  const rate = Number(prompt("Pourcentage d’acompte à facturer (ex. 30) :", "30"));
  if (!Number.isFinite(rate)) return;
  if (rate <= 0 || rate > 100) { showToast("Saisissez un pourcentage entre 1 et 100"); return; }
  if (!await confirmAppAction({ title: "Créer une facture d’acompte", message: `Une facture d’acompte de ${rate}% sera créée et numérotée.`, actionLabel: "Créer la facture" })) return;
  try {
    const invoice = await apiFetch(`/api/invoices/quote/${id}/create-deposit-invoice`, { method: "POST", body: JSON.stringify({ rate }) });
    await loadInvoiceData();
    showToast(`Facture d’acompte ${invoice.invoiceNumber} créée ✅`);
  } catch (err) { showToast(err.message || "Impossible de créer la facture d’acompte"); }
}
