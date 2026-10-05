// Application : index de recherche globale.

function findGlobalSearchResults(query, { contacts = [], products = [], documents = [], opportunities = [], tasks = [] }) {
  const matches = value => String(value || "").toLocaleLowerCase("fr-FR").includes(query);
  const documentLabels = { quote: "Devis", order: "Commande", invoice: "Facture", credit_note: "Avoir" };
  const contactResults = contacts.filter(contact => matches([contact.firstname, contact.lastname, contact.companyName, contact.email, contact.phone].join(" "))).slice(0, 4)
    .map(contact => ({ kind: "contact", id: contact._id, title: contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client", detail: contact.email || contact.phone || "Fiche client" }));
  const productResults = products.filter(product => matches([product.name, product.reference, product.category, product.description].join(" "))).slice(0, 4)
    .map(product => ({ kind: "product", id: product._id, title: product.name, detail: `${product.reference || "Sans référence"} · Stock : ${Number(product.stock || 0)}` }));
  const documentResults = documents.filter(document => matches([document.invoiceNumber, document.type, documentLabels[document.type], document.contactId?.firstname, document.contactId?.lastname, document.contactId?.companyName].join(" "))).slice(0, 6)
    .map(document => ({ kind: "document", id: document._id, title: document.invoiceNumber || "Document sans numéro", detail: `${documentLabels[document.type] || "Document"} · ${document.contactId?.companyName || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim() || "Client non renseigné"}` }));
  const opportunityResults = opportunities.filter(opportunity => matches([opportunity.title, opportunity.contactId?.firstname, opportunity.contactId?.lastname, opportunity.contactId?.companyName, opportunity.notes].join(" "))).slice(0, 4)
    .map(opportunity => ({ kind: "opportunity", id: opportunity._id, title: opportunity.title, detail: `Opportunité · ${opportunity.contactId?.companyName || `${opportunity.contactId?.firstname || ""} ${opportunity.contactId?.lastname || ""}`.trim() || "Sans client"}` }));
  const taskResults = tasks.filter(task => matches([task.title, task.contactId?.firstname, task.contactId?.lastname, task.contactId?.companyName, task.notes].join(" "))).slice(0, 4)
    .map(task => ({ kind: "task", id: task._id, title: task.title, detail: `${task.type === "appointment" ? "Rendez-vous" : "Tâche"} · ${task.contactId?.companyName || `${task.contactId?.firstname || ""} ${task.contactId?.lastname || ""}`.trim() || "Sans client"}` }));
  return [...contactResults, ...productResults, ...documentResults, ...opportunityResults, ...taskResults];
}
