// Documents commerciaux : payments. Voir README.md pour les responsabilités.

function getPaymentModalData(invoice) {
  if (!invoice || invoice.type !== "invoice") throw new Error("Facture introuvable");
  const remainingAmount = getInvoiceRemainingAmount(invoice);
  return {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    remainingAmount,
    amountLabel: `${remainingAmount.toFixed(2)} € TTC`
  };
}

function isValidPaymentAmount(amount, remainingAmount) {
  return Number.isFinite(amount) && amount > 0 && amount <= remainingAmount + 0.001;
}

function getPaymentConfirmationMessage(invoice, paymentMethod) {
  const remainingAmount = getInvoiceRemainingAmount(invoice);
  return invoice.paymentStatus === "paid"
    ? `Facture payée · ${paymentMethod} ✅`
    : `Règlement partiel enregistré · reste ${remainingAmount.toFixed(2)} €`;
}

function openPaymentModal(invoice) {
  const payment = getPaymentModalData(invoice);
  paymentInvoiceId = payment.invoiceId;
  selectedPaymentMethod = null;
  paymentRemainingAmount = payment.remainingAmount;

  document.getElementById("paymentInvoiceNumber").textContent = `Facture ${payment.invoiceNumber}`;
  document.getElementById("paymentInvoiceAmount").textContent = payment.amountLabel;
  const paymentAmountInput = document.getElementById("paymentAmountInput");
  if (paymentAmountInput) {
    paymentAmountInput.value = payment.remainingAmount.toFixed(2);
    paymentAmountInput.max = payment.remainingAmount.toFixed(2);
  }
  document.querySelectorAll(".payment-method-btn").forEach(button => button.classList.remove("selected"));
  document.getElementById("paymentModal").style.display = "flex";
}

async function markInvoicePaid(id) {
  try {
    const invoices = await apiFetch("/api/invoices");
    const invoice = invoices.find(item => item._id === id);
    openPaymentModal(invoice);
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
  if (!isValidPaymentAmount(amount, paymentRemainingAmount)) { showToast("Saisissez un montant valide"); return; }
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

    currentInvoice = structuredClone(updatedInvoice);
    await loadInvoices();
    closePaymentModal();

    if (currentInvoiceId === invoiceId) {
      await openInvoice(invoiceId);
    }

    showToast(getPaymentConfirmationMessage(updatedInvoice, paymentMethod));
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
