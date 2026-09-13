// ================= INVOICES =================

let editingQuoteId = null;
let isEditingQuote = false;
let currentInvoiceId = null;
let currentInvoice = null;
let availableProducts = [];

// LOAD SELECT DATA
async function loadInvoiceData() {

  const contacts =
  await apiFetch("/api/contacts");

 const products =
  await apiFetch("/api/products");

  const contactSelect =
    document.getElementById("invoiceContact");

  const productSelect =
    document.getElementById("invoiceProduct");

  if (!contactSelect || !productSelect) return;

  // CONTACTS
  contactSelect.innerHTML =
    `<option value="">Sélectionner un contact</option>`;

  contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
        ${contact.companyName || ""}
      </option>
    `;
  });

  // PRODUCTS
  productSelect.innerHTML =
    `<option value="">Sélectionner un produit</option>`;

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${product.name}
        (${product.stock} stock)
      </option>
    `;
  });
}

// LOAD INVOICES
async function loadInvoices() {

  try {

    const invoices =
  await apiFetch("/api/invoices");

    renderInvoices(invoices);

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

// RENDER INVOICES
function renderInvoices(invoices) {

  const invoiceList =
    document.getElementById("invoiceList");

  const quotesList =
    document.getElementById("quotesContainer");

  const acceptedQuotesList =
    document.getElementById("acceptedQuotesContainer");

  const ordersContainer =
    document.getElementById("ordersContainer");


  // Vérifier que les conteneurs principaux existent

  if (
    !invoiceList ||
    !quotesList ||
    !acceptedQuotesList
  ) {
    return;
  }


  // Vider les listes

  invoiceList.innerHTML = "";

  quotesList.innerHTML = "";

  acceptedQuotesList.innerHTML = "";

  if (ordersContainer) {
    ordersContainer.innerHTML = "";
  }


  // ================= DEVIS =================

  const quotes =
    invoices.filter(
      i =>
        i.type === "quote" &&
        i.status !== "accepted"
    );


  // ================= DEVIS ACCEPTÉS =================

  const acceptedQuotes =
    invoices.filter(
      i =>
        i.type === "quote" &&
        i.status === "accepted"
    );


  // ================= COMMANDES =================

  const orders =
    invoices.filter(
      i =>
        i.type === "order"
    );


  // ================= COMPTEURS =================

  const quotesCount =
    document.getElementById("quotesCount");

  if (quotesCount) {

    quotesCount.textContent =
      `${quotes.length} devis`;

  }


  const acceptedQuotesCount =
    document.getElementById(
      "acceptedQuotesCount"
    );

  if (acceptedQuotesCount) {

    acceptedQuotesCount.textContent =
      `${acceptedQuotes.length} devis`;

  }


  const ordersCount =
    document.getElementById("ordersCount");

  if (ordersCount) {

    ordersCount.textContent =
      `${orders.length} commande${
        orders.length > 1 ? "s" : ""
      }`;

  }


  // ================= AFFICHAGE =================

  invoices.forEach(invoice => {

    const date =
      new Date(invoice.createdAt);


    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    const month =
      date.toLocaleString(
        "fr-FR",
        {
          month: "short"
        }
      );


    const customerName =
      invoice.contactId?.companyName ||
      `${invoice.contactId?.firstname || ""}
       ${invoice.contactId?.lastname || ""}`;

    const articlesCount =
      invoice.products?.length || 0;


    const html = `

      <div
        class="erp-row"
        onclick="openInvoice('${invoice._id}')"
      >

        <div class="erp-date">

          <div class="erp-day">
            ${day}
          </div>

          <div class="erp-month">
            ${month}
          </div>

        </div>


        <div class="erp-customer">

          <div class="erp-number">
            ${invoice.invoiceNumber}
          </div>

          <div class="erp-name">
            ${customerName}
          </div>

          <div class="erp-items">
            ${articlesCount}
            article${articlesCount > 1 ? "s" : ""}
          </div>

        </div>


        <div class="erp-amounts">

          <div>
            ${Number(invoice.totalTTC).toFixed(2)}
            €
            TTC
          </div>

          <small>
            ${Number(invoice.totalHT).toFixed(2)}
            €
            HT
          </small>

          ${
            invoice.type === "invoice"
              ? `<span class="invoice-status ${
                  invoice.paymentStatus === "paid" ? "paid" : "pending"
                }">${
                  invoice.paymentStatus === "paid"
                    ? `Payée · ${invoice.paymentMethod || "Paiement"}`
                    : "En attente"
                }</span>`
              : ""
          }

        </div>

      </div>

    `;


    // ================= DEVIS =================

    if (invoice.type === "quote") {

      if (invoice.status === "accepted") {

        acceptedQuotesList.innerHTML += html;

      } else {

        quotesList.innerHTML += html;

      }

    }


    // ================= COMMANDES =================

    else if (invoice.type === "order") {

      if (ordersContainer) {

        ordersContainer.innerHTML += html;

      }

    }


    // ================= FACTURES =================

    else {

      invoiceList.innerHTML += html;

    }

  });

}

// CREATE INVOICE
async function createInvoice() {

  const contactId =
    document.getElementById("invoiceContact").value;

  const productId =
    document.getElementById("invoiceProduct").value;

  const quantity =
    document.getElementById("invoiceQuantity").value;

  const type = "invoice";

  const paymentMethod =
    document.getElementById("paymentMethod").value;

  if (!contactId || !productId) {

    showToast(
      "Contact et produit obligatoires ❗"
    );

    return;
  }

  showLoader();

  try {

    await apiFetch("/api/invoices", {

      method: "POST",

      body: JSON.stringify({

        type,
        contactId,
        paymentMethod,

        products: [
          {
            productId,
            quantity: Number(quantity)
          }
        ]
      })
    });

    await loadInvoices();

    await loadProducts();

    await loadInvoiceData();

    showToast("Document créé ✅");

  } catch (err) {

    console.error(err);

    showToast(
      err.message || "Erreur API"
    );

  } finally {

    hideLoader();
  }
}

// MARK PAID
let paymentInvoiceId = null;
let selectedPaymentMethod = null;

async function markInvoicePaid(id) {
  try {
    const invoices = await apiFetch("/api/invoices");
    const invoice = invoices.find(item => item._id === id);

    if (!invoice || invoice.type !== "invoice") {
      throw new Error("Facture introuvable");
    }

    paymentInvoiceId = id;
    selectedPaymentMethod = null;

    document.getElementById("paymentInvoiceNumber").textContent =
      `Facture ${invoice.invoiceNumber}`;
    document.getElementById("paymentInvoiceAmount").textContent =
      `${Number(invoice.totalTTC).toFixed(2)} € TTC`;
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

  try {
    const updatedInvoice = await apiFetch(
      `/api/invoices/pay/${invoiceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ paymentMethod })
      }
    );

    currentInvoice = structuredClone(updatedInvoice);
    await loadInvoices();
    closePaymentModal();

    if (currentInvoiceId === invoiceId) {
      await openInvoice(invoiceId);
    }

    showToast(`Facture payée · ${paymentMethod} ✅`);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Erreur lors du paiement");
  }
}

// DELETE INVOICE
async function deleteInvoice(id) {

  try {

    await apiFetch(
  `/api/invoices/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadInvoices();

    showToast(
      "Document supprimé 🗑️"
    );

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

async function loadQuoteData() {

  console.log("LOAD QUOTES DATA EXECUTE");

  const contacts =
    await apiFetch("/api/contacts");

    console.log("CONTACTS =", contacts);

  const products =
    await apiFetch("/api/products");

    console.log("PRODUCTS =", products);

  const contactSelect =
    document.getElementById("quoteContact");

  const productSelects =
  document.querySelectorAll(".quote-product");

    if (!contactSelect) return;

  contactSelect.innerHTML =
    '<option value="">Sélectionner un contact</option>';

 contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
      </option>
    `;
  });

  productSelects.forEach(select => {

  select.innerHTML =
    '<option value="">Sélectionner un produit</option>';

  products.forEach(product => {

    select.innerHTML += `
      <option value="${product._id}">
        ${product.name}
      </option>
    `;

  });

});
}

// ================= ORDER TABS =================

function showOrderTab(tabId) {

  document
    .querySelectorAll(".order-tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });

  document
    .getElementById(tabId)
    ?.classList.add("active");
}



window.toggleQuoteForm = async function() {

  const form =
    document.getElementById("quoteModal");

  if (!form) return;

  const opening =
    form.style.display === "none";

  form.style.display =
    opening ? "block" : "none";

  if (opening) {

    console.log("QUOTES OPEN");

    await loadQuoteData();

  }
}

// ================= CREATE QUOTES =================

async function createQuote() {

  const contactId =
    document.getElementById("quoteContact").value;

  const products = [];

document
  .querySelectorAll(".quote-line")
  .forEach(line => {

    const productId =
      line.querySelector(".quote-product").value;

    const quantity =
      parseInt(
        line.querySelector(".quote-quantity").value
      );

    if (productId && quantity > 0) {

      products.push({
        productId,
        quantity,
        discount: 0
      });

    }

  });

  if (!contactId) {
    return showToast("Sélectionnez un contact");
  }

  if (products.length === 0) {
  return showToast(
    "Ajoutez au moins un article"
  );
}

  try {

    const method =
  editingQuoteId ? "PUT" : "POST";

    const url =
  editingQuoteId
    ? `/api/invoices/${editingQuoteId}`
    : "/api/invoices";

    await apiFetch(url, {

     method,

      body: JSON.stringify({

        type: "quote",

        contactId,

        paymentMethod: "pending",

        products
})

    });

    await loadInvoices();

    editingQuoteId = null;

    showToast(
    editingQuoteId
    ? "Devis modifié ✅"
    : "Devis créé ✅"
 );

    editingQuoteId = null;

    closeQuoteModal();

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }

}

    function closeQuoteModal() {

  const modal =
    document.getElementById("quoteModal");

  if (!modal) return;

  modal.style.display = "none";
}

// ================= CREATE QUOTES =================

async function acceptQuote(id) {

  try {

    await apiFetch(
      `/api/invoices/accept/${id}`,
      {
        method: "PUT"
      }
    );

    await loadInvoices();

    showToast("Devis accepté");

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }
}

// ================= CONVERT QUOTE TO ORDER =================

async function convertQuoteToOrder(id) {

  try {

    const order =
      await apiFetch(
        `/api/invoices/convert-to-order/${id}`,
        {
          method: "POST"
        }
      );

    showToast(
      `Commande ${order.invoiceNumber} créée ✅`
    );

    // Actualiser la liste des documents
    await loadInvoices();

    // Fermer la fiche actuelle
    closeInvoiceDetails();

  } catch (err) {

    console.error(err);

    showToast(
      err.message ||
      "Erreur lors de la transformation en commande"
    );

  }

}

// ================= CONVERT ORDER TO INVOICE =================

async function convertOrderToInvoice(id) {

  try {

    const invoice =
      await apiFetch(
        `/api/invoices/convert-to-invoice/${id}`,
        {
          method: "POST"
        }
      );

    showToast(
      `Facture ${invoice.invoiceNumber} créée ✅`
    );

    await loadInvoices();

    closeInvoiceDetails();

  } catch (err) {

    console.error(err);

    showToast(
      err.message ||
      "Erreur lors de la transformation de la commande en facture"
    );

  }

}

async function viewQuote(id) {

  try {
    const response = await fetch(
      `${API_URL}/api/invoices/pdf/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Impossible de générer le PDF");
    }

    const pdfUrl = URL.createObjectURL(await response.blob());
    window.open(pdfUrl, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);

  } catch (err) {
    console.error(err);
    showToast(err.message);
  }

}

async function editQuote(id) {

  const invoices =
    await apiFetch("/api/invoices");

  const quote =
    invoices.find(i => i._id === id);

  if (!quote) return;

  editingQuoteId = id;

  document.getElementById("quoteContact").value =
    quote.contactId;

  const firstProduct =
  document.querySelector(".quote-product");

  const firstQuantity =
  document.querySelector(".quote-quantity");

    if (firstProduct) {
  firstProduct.value =
    quote.products[0].productId;
}

    if (firstQuantity) {
  firstQuantity.value =
    quote.products[0].quantity;
}

  document.getElementById("quoteModal").style.display =
    "block";

}

function addQuoteLine() {

  const container =
    document.getElementById("quoteLines");

  if (!container) return;

  const firstSelect =
    document.querySelector(".quote-product");

  const options =
    firstSelect
      ? firstSelect.innerHTML
      : '<option value="">Sélectionner un produit</option>';

  const line =
    document.createElement("div");

  line.className = "quote-line";

  line.innerHTML = `

    <select class="quote-product">
      ${options}
    </select>

    <input
      class="quote-quantity"
      type="number"
      min="1"
      value="1"
    />

    <button
      type="button"
      onclick="this.parentElement.remove()"
    >
      X
    </button>

  `;

  container.appendChild(line);

}

function renderInvoiceModal(invoice){

    document.getElementById(
        "invoiceDetailsBody"
    ).innerHTML = `

    `;

}

async function openInvoice(id) {

  currentInvoiceId = id;

  const invoices =
    await apiFetch("/api/invoices");

  const invoice =
   invoices.find(i => i._id === id);

if (!invoice) return;

currentInvoice =
    structuredClone(invoice);

recalculateInvoice();

  document.getElementById(
    "invoiceDetailsModal"
  ).style.display = "flex";

  document.getElementById(
    "detailNumber"
  ).innerText =
    invoice.invoiceNumber;

  document.getElementById(
  "invoiceDetailsBody"
).innerHTML = `

  <div class="invoice-detail-card">

  <div class="quote-header">

<div class="quote-header-left">

<p>
<strong>Client</strong><br>
${
    invoice.contactId?.companyName ||
    `${invoice.contactId?.firstname || ""} ${invoice.contactId?.lastname || ""}`
}
</p>

<p>
<strong>${
  invoice.type === "quote"
    ? "Date du devis"
    : invoice.type === "order"
      ? "Date de la commande"
      : "Date de la facture"
}</strong><br>
${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
</p>

</div>

<div class="quote-header-right">

<p>
<strong>N°</strong><br>
${invoice.invoiceNumber}
</p>

<p>
<strong>Livraison</strong><br>
À définir
</p>

</div>

</div>

${
    isEditingQuote
    ? `
        <div class="quote-toolbar">

            <button
                class="primary-btn"
                onclick="openAddProductModal()"
            >
                ➕ Ajouter un produit
            </button>

        </div>
      `
    : ""
}

<h4>Articles</h4>

<div class="quote-table-header">

    <div>Produit</div>
    <div>Qté</div>
    <div>PU HT</div>
    <div>PU TTC</div>
    <div>Remise</div>
    <div>Total HT</div>
    <div>TOTAL TTC</div>
    <div></div>

</div>

${currentInvoice.products.map((item, itemIndex) => `

<div class="quote-product-row">

    <div class="quote-product-name">
        ${item.productId.name}
    </div>

    <div class="quote-product-qty">

        ${
            isEditingQuote
            ? `
                <input
    type="number"
    min="1"
    value="${item.quantity}"
    class="edit-qty"
    oninput="recalculateInvoice()"
    style="width:60px;text-align:center;"
>
            `
            : item.quantity
        }

    </div>

    <div class="quote-product-price">
        ${item.unitHT.toFixed(2)} €
    </div>

    <div class="quote-product-price-ttc">
        ${item.unitTTC.toFixed(2)} €
    </div>

    <div class="quote-product-discount">

${
    isEditingQuote
    ? `
        <input
    type="number"
    min="0"
    max="100"
    value="${item.discount || 0}"
    class="edit-discount"
    oninput="recalculateInvoice()"
    style="width:65px;text-align:center;"
>
      `
    : `${item.discount || 0} %`
}

</div>

    <div class="quote-product-total line-total-ht">
        ${item.lineHT.toFixed(2)} €
    </div>

    <div class="quote-product-total-ttc line-total-ttc">
        ${item.lineTTC.toFixed(2)} €
    </div>

    <div class="quote-product-delete">

        ${
            isEditingQuote
            ? `
                <button
                    class="delete-line-btn"
                    onclick="removeInvoiceLine(${itemIndex})"
                >
                    ✕
                </button>
            `
            : ""
        }

    </div>

</div>

`).join("")}

<br>

<div class="quote-footer">

    <div
      class="invoice-detail-actions"
       style="
        display:flex;
        gap:10px;
        align-items:flex-end;
      "
    >

    ${
    invoice.type === "quote" &&
    invoice.status !== "accepted"
    ? `
      <button
        class="primary-btn"
        onclick="acceptQuote('${invoice._id}')"
      >
        Accepter le devis
      </button>
    `
    : ""
}

    ${
    invoice.type === "order" &&
    !invoice.convertedToInvoiceId
    ? `
      <button
        class="primary-btn"
        onclick="convertOrderToInvoice('${invoice._id}')"
      >
        Transformer en facture
      </button>
    `
    : ""
}

    ${
    invoice.type === "quote" &&
    invoice.status === "accepted" &&
    !invoice.convertedToOrderId
    ? `
      <button
        class="primary-btn"
        onclick="convertQuoteToOrder('${invoice._id}')"
      >
        Transformer en commande
      </button>
    `
    : ""
}

     ${
  invoice.type !== "invoice"
  ? `
    <button
      id="editInvoiceBtn"
      class="primary-btn"
      onclick="
      ${
          isEditingQuote
          ? `saveInvoiceEdition()`
          : `enableInvoiceEdition()`
      }
      "
    >
      ${
          isEditingQuote
          ? "Enregistrer"
          : "Modifier"
      }
    </button>

    <button
      class="secondary-btn"
      onclick="deleteInvoice('${invoice._id}')"
    >
      Supprimer
    </button>
  `
  : ""
}

${
  invoice.type === "invoice" &&
  invoice.paymentStatus !== "paid"
  ? `
    <button
      class="primary-btn"
      onclick="markInvoicePaid('${invoice._id}')"
    >
      Marquer comme payée
    </button>
  `
  : ""
}

${
  invoice.type === "invoice" &&
  invoice.paymentStatus === "paid"
  ? `
    <span
      class="invoice-paid-badge"
      style="
        display:inline-flex;
        align-items:center;
        padding:10px 16px;
        border-radius:10px;
        font-weight:600;
      "
    >
      Payée
    </span>
  `
  : ""
}

    </div>

    <div class="quote-summary">

        <div class="summary-row">
            <span>Sous-total HT</span>
            <strong id="summaryTotalHT">
           ${currentInvoice.totalHT.toFixed(2)} €
            </strong>

        </div>

        <div class="summary-row">
            <span>Remises</span>
            <strong>0,00 €</strong>
        </div>

        <div class="summary-row">
            <span>TVA</span>
            <strong id="summaryTVA">
            ${(currentInvoice.totalTTC - currentInvoice.totalHT).toFixed(2)} €
            </strong>
        </div>

        <div class="summary-total">
            <span>TOTAL TTC</span>
            <strong id="summaryTotalTTC">
            ${currentInvoice.totalTTC.toFixed(2)} €
            </strong>
        </div>

    </div>

</div>

`;

}

function enableInvoiceEdition() {

    isEditingQuote = true;

    openInvoice(currentInvoiceId);

}

async function saveInvoiceEdition(){

    try{

        const qtyInputs =
    document.querySelectorAll(".edit-qty");

const discountInputs =
    document.querySelectorAll(".edit-discount");

qtyInputs.forEach((input, index) => {

    currentInvoice.products[index].quantity =
        Number(input.value);

    currentInvoice.products[index].discount =
        Number(discountInputs[index].value) || 0;

});

        await apiFetch(

            `/api/invoices/${currentInvoice._id}`,

            {

                method:"PUT",

                body:JSON.stringify({

                    contactId: currentInvoice.contactId,

                    products: currentInvoice.products

                })

            }

        );

        isEditingQuote = false;

        await loadInvoices();

        closeInvoiceDetails();

        showToast("Devis enregistré ✅");

    }

    catch(err){

        console.error(err);

        showToast(err.message);

    }

}


function closeInvoiceDetails() {

    isEditingQuote = false;
    currentInvoiceId = null;

    document.getElementById(
        "invoiceDetailsModal"
    ).style.display = "none";

}

async function openAddProductModal(){

    availableProducts =
        await apiFetch("/api/products");

    document.getElementById("addProductBody").innerHTML = `

        <input
            id="productSearch"
            type="text"
            placeholder="Rechercher un produit..."
            style="
                width:100%;
                padding:12px;
                margin-bottom:20px;
                border-radius:10px;
            "
        >

        <div id="productList">

            ${availableProducts.map(product => `

                <div
    class="product-picker-row"
    onclick="addProductToInvoice('${product._id}')"
>

    <div>

        <strong>${product.name}</strong>

        <div class="erp-items">
            ${Number(product.priceHT).toFixed(2)} € HT
        </div>

    </div>

    <button
        class="primary-btn"
        type="button"
    >
        Ajouter
    </button>

</div>

            `).join("")}

        </div>

    `;

    document.getElementById("addProductModal").style.display = "flex";

}

function addProductToInvoice(productId){

    const product = availableProducts.find(
        p => p._id === productId
    );

    if(!product) return;

    const existing = currentInvoice.products.find(

    item => item.productId._id === productId

);

if(existing){

    existing.quantity += 1;

}else{

    currentInvoice.products.push({

        productId: product,

        quantity: 1,

        discount: 0,

        unitHT: Number(product.priceHT),

        unitTTC:
            Number(product.priceHT) *
            (1 + Number(product.tva || 20) / 100)

    });

}

    document.getElementById("addProductModal").style.display = "none";

    recalculateInvoice();
    
}

function closeAddProductModal(){

    document.getElementById("addProductModal").style.display = "none";

}

function removeInvoiceLine(index){

    currentInvoice.products.splice(index, 1);

    isEditingQuote = true;

    openInvoice(currentInvoiceId);

}

function recalculateInvoice(){

    document.querySelectorAll(".edit-qty")
        .forEach((input,index)=>{

            currentInvoice.products[index].quantity =
                Number(input.value);

        });

    document.querySelectorAll(".edit-discount")
        .forEach((input,index)=>{

            currentInvoice.products[index].discount =
                Number(input.value);

        });

        currentInvoice.products.forEach(item => {

    item.unitHT =
        Number(item.productId.priceHT);

    item.unitTTC =
        item.unitHT *
        (1 + Number(item.productId.tva || 20) / 100);

    const remise =
        Number(item.discount || 0);

    item.lineHT =
        item.unitHT *
        item.quantity *
        (1 - remise / 100);

    item.lineTTC =
        item.unitTTC *
        item.quantity *
        (1 - remise / 100);

  });


        let totalHT = 0;
        let totalTTC = 0;

  currentInvoice.products.forEach(item => {

        totalHT += item.lineHT;
        totalTTC += item.lineTTC;

        });

currentInvoice.totalHT = totalHT;
currentInvoice.totalTTC = totalTTC;

        document.querySelectorAll(".line-total-ht")
    .forEach((cell, index) => {

        cell.textContent =
            `${currentInvoice.products[index].lineHT.toFixed(2)} €`;

    });

document.querySelectorAll(".line-total-ttc")
    .forEach((cell, index) => {

        cell.textContent =
            `${currentInvoice.products[index].lineTTC.toFixed(2)} €`;

    });

    const totalHTElement =
    document.getElementById("summaryTotalHT");

const totalTVAElement =
    document.getElementById("summaryTVA");

const totalTTCElement =
    document.getElementById("summaryTotalTTC");

if(totalHTElement){

    totalHTElement.textContent =
        `${currentInvoice.totalHT.toFixed(2)} €`;

}

if(totalTVAElement){

    totalTVAElement.textContent =
        `${(currentInvoice.totalTTC - currentInvoice.totalHT).toFixed(2)} €`;

}

if(totalTTCElement){

    totalTTCElement.textContent =
        `${currentInvoice.totalTTC.toFixed(2)} €`;

  }
}
