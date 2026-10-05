// Documents commerciaux : editor. Voir README.md pour les responsabilités.

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

async function openAddProductModal(){
    availableProducts = await apiFetch("/api/products");
    renderInvoiceProductPicker(availableProducts);
    document.getElementById("addProductModal").style.display = "flex";
}

function addProductToInvoice(productId){
    if (!addInvoiceProduct(availableProducts, productId)) return;
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

    currentInvoice.products.forEach(item =>
      recalculateInvoiceLine(item, isEditingQuote)
    );


  const totals = getInvoiceTotals(currentInvoice.products);
  currentInvoice.totalHT = totals.totalHT;
  currentInvoice.totalTTC = totals.totalTTC;

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
