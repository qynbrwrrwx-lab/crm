const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const documentReadController = require("../controllers/documentReadController");
const deliveryNoteController = require("../controllers/deliveryNoteController");
const commercialDocumentPdfController = require("../controllers/commercialDocumentPdfController");
const commercialDocumentEmailController = require("../controllers/commercialDocumentEmailController");
const commercialDocumentDuplicateController = require("../controllers/commercialDocumentDuplicateController");
const commercialDocumentCreationController = require("../controllers/commercialDocumentCreationController");
const invoicePaymentController = require("../controllers/invoicePaymentController");
const commercialDocumentDeletionController = require("../controllers/commercialDocumentDeletionController");
const commercialDocumentWorkflowController = require("../controllers/commercialDocumentWorkflowController");
const creditNoteController = require("../controllers/creditNoteController");
const depositInvoiceController = require("../controllers/depositInvoiceController");
const quoteConversionController = require("../controllers/quoteConversionController");
const orderConversionController = require("../controllers/orderConversionController");
const commercialDocumentUpdateController = require("../controllers/commercialDocumentUpdateController");

const auth = require("../middleware/auth");

const documentEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: req => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop d'envois d'e-mails. Réessayez dans quelques minutes." }
});

// ================= GET INVOICES =================

router.get("/", auth, documentReadController.listDocuments);

// ================= DOCUMENT ACTIVITY =================

router.get("/:id/activity", auth, documentReadController.getDocumentActivity);

// ================= CREATE INVOICE =================

router.post("/", auth, commercialDocumentCreationController.createCommercialDocument);

// ================= DUPLICATE QUOTE =================

router.post("/duplicate-quote/:id", auth, commercialDocumentDuplicateController.duplicateQuote);

// ================= MARK PAID =================

router.put("/pay/:id", auth, invoicePaymentController.recordInvoicePayment);

// ================= DELETE INVOICE =================

router.post("/credit-note/:id", auth, creditNoteController.createCreditNote);

router.delete("/:id", auth, commercialDocumentDeletionController.deleteDraftQuote);

// ================= ACCEPT QUOTE =================

router.put("/accept/:id", auth, commercialDocumentWorkflowController.acceptQuote);

// ================= CONVERT QUOTE TO ORDER =================

router.post("/quote/:id/create-deposit-invoice", auth, depositInvoiceController.createDepositInvoice);

router.put("/:id/fulfillment-status", auth, commercialDocumentWorkflowController.updateOrderFulfillmentStatus);

router.post("/convert-to-order/:id", auth, quoteConversionController.convertQuoteToOrder);

// ================= CONVERT ORDER TO INVOICE =================

router.post("/convert-to-invoice/:id", auth, orderConversionController.convertOrderToInvoice);

// ================= PDF =================

router.post("/:id/send-reminder", auth, documentEmailLimiter, commercialDocumentEmailController.sendPaymentReminder);

router.post("/:id/send-email", auth, documentEmailLimiter, commercialDocumentEmailController.sendCommercialDocumentEmail);

router.get("/pdf/:id", auth, commercialDocumentPdfController.renderDocumentPdf);

router.get("/:id/delivery-note", auth, deliveryNoteController.renderOrderDeliveryNote);

router.post("/:id/send-delivery-note", auth, documentEmailLimiter, deliveryNoteController.sendOrderDeliveryNote);

// ================= UPDATE INVOICE =================

router.put("/:id", auth, commercialDocumentUpdateController.updateCommercialDocument);

module.exports = router;
