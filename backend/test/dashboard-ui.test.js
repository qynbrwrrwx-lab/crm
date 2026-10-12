const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const frontend = path.resolve(__dirname, '../../frontend');
const html = fs.readFileSync(path.join(frontend, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(m => m[1]);
const modules = scripts.filter(s => s === '/js/dashboard.js' || s.startsWith('/js/dashboard/'));
function browser() {
  const elements = new Map();
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) {
    const classes = new Set();
    elements.set(id, { textContent: '', innerText: '', innerHTML: '', value: '', hidden: false,
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) } });
  }
  const calls = [], charts = [];
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-09-15T12:00:00Z'])); }
  }
  const context = vm.createContext({ Date: FixedDate,
    document: { getElementById: id => elements.get(id) || null, querySelector: () => null },
    console: { warn() {} }, chart: null, analyticsChart: null, allInvoices: [], allExpenses: [],
    apiFetch: async url => { throw new Error(`Unexpected request ${url}`); },
    showSection: section => calls.push(section), setExpenseQuickFilter: f => calls.push(f),
    setInvoiceQuickFilter: f => calls.push(f), setElectronicInvoiceQuickFilter: f => calls.push(f),
    openClientProfile: id => calls.push(id),
    Chart: function(canvas, options) { this.options = options; this.destroy = () => { this.destroyed = true; }; charts.push(this); }
  });
  for (const s of ['/js/core/text.js', '/js/core/formatters.js', ...modules]) vm.runInContext(fs.readFileSync(path.join(frontend, s), 'utf8'), context, { filename: s });
  return { context, elements, calls, charts, node: id => elements.get(id) };
}
test('dashboard scripts load once before application initialization', () => {
  assert.equal(modules.length, 8);
  assert.equal(new Set(modules).size, 8);
  assert.equal(modules[0], '/js/dashboard.js');
  assert.deepEqual(modules.slice(1).map(s => path.basename(s)).sort(), fs.readdirSync(path.join(frontend, 'js/dashboard')).filter(s => s.endsWith('.js')).sort());
  for (const s of modules) assert.ok(scripts.indexOf(s) < scripts.indexOf('/js/app.js'));
  assert.equal(browser().charts.length, 0);
});
test('stock indicators preserve zero thresholds and purchase value', () => {
  const b = browser(); b.context.updateStockKPI([{ stock: 0, lowStockThreshold: 0 }, { stock: 2, lowStockThreshold: 0, priceHT: 20, purchasePriceHT: 12 }]);
  assert.equal(b.node('dashboardLowStock').innerText, 1);
  assert.equal(b.node('dashboardOutOfStock').innerText, 1);
  assert.equal(b.node('dashboardProductCount').innerText, 2);
  assert.equal(b.node('dashboardStockValue').innerText, b.context.formatCurrency(40));
  assert.ok(b.node('dashboardStockValue').title.includes(b.context.formatCurrency(24)));
});
test('stock indicator presentation centralizes counts, value and potential margin', () => {
  const b = browser();
  const presentation = b.context.getStockKpiPresentation([{ stock: 2, lowStockThreshold: 3, priceHT: 20, purchasePriceHT: 12 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(presentation)), {
    lowStock: 1, outOfStock: 0, count: 1, valueLabel: b.context.formatCurrency(40),
    valueDetail: `Valeur d’achat : ${b.context.formatCurrency(24)} · Marge potentielle : ${b.context.formatCurrency(16)}`
  });
});
test('payment alert presentation centralizes overdue and pending states', () => {
  const b = browser();
  const overdue = b.context.getPaymentAlertPresentation({ pending: [{}, {}], overdue: [{}, {}], overdueTotal: 120 });
  assert.deepEqual(JSON.parse(JSON.stringify(overdue)), { label: '2 factures en retard', detail: `${b.context.formatCurrency(120)} à relancer en priorité.`, filter: 'overdue', isOverdue: true });
  const pending = b.context.getPaymentAlertPresentation({ pending: [{}], overdue: [], overdueTotal: 0 });
  assert.equal(pending.label, '<span id="dashboardPendingInvoicesAlert">1</span> facture(s) à encaisser');
  assert.equal(pending.filter, 'pending');
});
test('business KPI presentation centralizes counts and totals', () => {
  const b = browser();
  const metrics = b.context.getBusinessMetrics([
    { type: 'quote', totalTTC: 10 }, { type: 'order', totalTTC: 20 },
    { type: 'invoice', paymentStatus: 'pending', totalTTC: 30 }, { type: 'invoice', paymentStatus: 'paid', totalTTC: 40 }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(b.context.getBusinessKpiPresentation(metrics))), {
    quoteCount: 1, orderCount: 1, pendingCount: 1,
    pendingTotalLabel: b.context.formatCurrency(30), paidTotalLabel: b.context.formatCurrency(40)
  });
});
test('cash forecast deducts partial payments and excludes settled and distant documents', () => {
  const b = browser(); b.context.allInvoices = [
    { type: 'invoice', totalTTC: 100, payments: [{ amount: 40 }], paymentDueDate: '2026-09-20' },
    { type: 'invoice', totalTTC: 1000, paymentStatus: 'paid', paymentDueDate: '2026-09-20' },
    { type: 'quote', totalTTC: 2000, paymentDueDate: '2026-09-20' },
    { type: 'invoice', totalTTC: 3000, paymentDueDate: '2026-12-01' }
  ];
  b.context.allExpenses = [{ amountTTC: 80, dueDate: '2026-09-20' }, { status: 'paid', amountTTC: 999, dueDate: '2026-09-20' }];
  b.context.updateCashForecast();
  assert.equal(b.node('dashboardCashForecast').textContent, b.context.formatCurrency(-20));
  assert.equal(b.node('dashboardCashForecast').className, 'is-negative');
});
test('cash forecast presentation centralizes display labels and balance state', () => {
  const b = browser();
  const presentation = b.context.getCashForecastPresentation(
    [{ type: 'invoice', totalTTC: 100, payments: [{ amount: 25 }], paymentDueDate: '2026-09-20' }],
    [{ amountTTC: 20, dueDate: '2026-09-20' }],
    new b.context.Date('2026-09-15T12:00:00Z')
  );
  assert.deepEqual(JSON.parse(JSON.stringify(presentation)), {
    valueLabel: b.context.formatCurrency(55), className: 'is-positive',
    detailLabel: `${b.context.formatCurrency(75)} à encaisser · ${b.context.formatCurrency(20)} à décaisser d’ici 30 jours.`
  });
});
test('expense dashboard presentation centralizes paid, pending and margin amounts', () => {
  const b = browser();
  const presentation = b.context.getExpenseDashboardPresentation(
    [{ type: 'invoice', paymentStatus: 'paid', totalTTC: 200 }, { type: 'quote', paymentStatus: 'paid', totalTTC: 1000 }],
    [{ status: 'paid', amountTTC: 75 }, { amountTTC: 20 }]
  );
  assert.deepEqual(JSON.parse(JSON.stringify(presentation)), {
    paidExpensesLabel: b.context.formatCurrency(75),
    pendingExpensesLabel: b.context.formatCurrency(20),
    estimatedMarginLabel: b.context.formatCurrency(125)
  });
});
test('expense alerts select overdue expenses and reset navigation when cleared', () => {
  const b = browser(); b.context.updateExpenseAlert([{ amountTTC: 50, dueDate: '2026-09-01' }, { status: 'paid', dueDate: '2026-09-01' }]);
  assert.match(b.node('dashboardExpenseAlertLabel').textContent, /^1 échéance/);
  b.node('dashboardExpenseAlertButton').onclick(); assert.deepEqual(b.calls, ['expensesSection', 'overdue']);
  b.context.updateExpenseAlert([]); assert.equal(b.node('dashboardExpenseAlertDot').classList.contains('overdue'), false);
});
test('expense alert presentation centralizes overdue totals and empty state', () => {
  const b = browser();
  const now = new b.context.Date('2026-09-15T12:00:00Z');
  const overdue = b.context.getExpenseAlertPresentation([
    { amountTTC: 50, dueDate: '2026-09-01' }, { amountTTC: 20, dueDate: '2026-09-02' },
    { status: 'paid', amountTTC: 99, dueDate: '2026-09-01' }
  ], now);
  assert.deepEqual(JSON.parse(JSON.stringify(overdue)), { label: '2 échéances fournisseur en retard', detail: `${b.context.formatCurrency(70)} à régulariser.`, buttonLabel: 'Gérer', filter: 'overdue' });
  assert.equal(b.context.getExpenseAlertPresentation([], now).buttonLabel, 'Voir');
});
test('client follow-up prioritizes the oldest date without mutating contacts', () => {
  const b = browser(); const contacts = [{ _id: 'new', nextFollowUpAt: '2026-09-10' }, { _id: 'old', companyName: '<Client>', nextFollowUpAt: '2026-09-01' }];
  b.context.updateClientFollowUpAlert(contacts); b.node('dashboardFollowUpAlertButton').onclick();
  assert.deepEqual(b.calls, ['contacts', 'old']); assert.equal(contacts[0]._id, 'new');
  assert.equal(b.node('dashboardFollowUpAlertDetail').textContent, 'Priorité : <Client>.');
});
test('client follow-up presentation centralizes the priority and empty states', () => {
  const b = browser();
  const now = new b.context.Date('2026-09-15T12:00:00Z');
  const due = b.context.getClientFollowUpAlertPresentation([
    { _id: 'later', companyName: 'B', nextFollowUpAt: '2026-09-10' },
    { _id: 'first', firstname: 'A', lastname: 'Client', nextFollowUpAt: '2026-09-01' }
  ], now);
  assert.deepEqual(JSON.parse(JSON.stringify(due)), { label: '2 relances client à effectuer', detail: 'Priorité : A Client.', buttonLabel: 'Voir', contactId: 'first' });
  assert.equal(b.context.getClientFollowUpAlertPresentation([], now).buttonLabel, 'Clients');
});
test('recent activity escapes names, sorts and limits to six without modifying input', () => {
  const b = browser(); const docs = Array.from({ length: 8 }, (_, i) => ({ _id: String(i), invoiceNumber: '<num>', contactId: { companyName: '<client>' }, createdAt: `2026-09-0${i + 1}`, totalTTC: 10, type: 'invoice' }));
  b.context.updateRecentActivity(docs); const body = b.node('dashboardRecentActivityList').innerHTML;
  assert.equal((body.match(/dashboard-activity-row/g) || []).length, 6);
  assert.ok(body.indexOf("openInvoice('7')") < body.indexOf("openInvoice('6')"));
  assert.match(body, /&lt;client&gt;/); assert.doesNotMatch(body, /<num>/); assert.equal(docs[0]._id, '0');
  b.context.updateRecentActivity([]); assert.match(b.node('dashboardRecentActivityList').innerHTML, /empty-state/);
});
test('recent activity presentation centralizes document labels and payment status', () => {
  const b = browser(); const invoice = { _id: 'i', invoiceNumber: 'F-1', contactId: { companyName: 'Client' }, createdAt: '2026-09-05', totalTTC: 120, type: 'invoice', paymentStatus: 'paid' };
  const item = b.context.getRecentActivityPresentation(invoice); assert.deepEqual(JSON.parse(JSON.stringify(item)), { id: 'i', typeLabel: 'Facture', number: 'F-1', client: 'Client', dateLabel: new b.context.Date('2026-09-05').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }), statusLabel: 'Facture réglée', amountLabel: b.context.formatCurrency(120) });
  assert.equal(b.context.getRecentActivityPresentation({ _id: 'o', type: 'order', totalTTC: 0 }).statusLabel, 'Commande');
});
test('recent activity list presentation centralizes sorting, limits and empty state', () => {
  const b = browser();
  const documents = Array.from({ length: 7 }, (_, index) => ({ _id: String(index), type: 'invoice', invoiceNumber: `FAC-${index}`, paymentStatus: index === 0 ? 'paid' : 'pending', totalTTC: index, createdAt: `2026-10-${String(index + 1).padStart(2, '0')}` }));
  const presentation = b.context.getRecentActivityListPresentation(documents);
  assert.equal(presentation.items.length, 6);
  assert.equal(presentation.items[0].id, '6');
  assert.equal(presentation.items.at(-1).id, '1');
  assert.equal(presentation.emptyMessage, 'Aucune activité commerciale pour le moment.');
  assert.deepEqual(JSON.parse(JSON.stringify(b.context.getRecentActivityListPresentation([]))), { emptyMessage: 'Aucune activité commerciale pour le moment.', items: [] });
});
test('electronic invoicing alert preserves configuration and ready-document navigation', async () => {
  const b = browser(); b.context.apiFetch = async url => { assert.equal(url, '/api/electronic-invoicing/status'); return { enabled: false }; };
  await b.context.updateElectronicInvoicingAlert([]); b.node('dashboardElectronicAlertButton').onclick(); assert.deepEqual(b.calls, ['company']);
  b.context.apiFetch = async () => ({ enabled: true, identityComplete: true });
  await b.context.updateElectronicInvoicingAlert([{ electronicTransmission: { status: 'ready' } }]);
  b.node('dashboardElectronicAlertButton').onclick(); assert.deepEqual(b.calls.slice(1), ['invoicesSection', 'ready']);
});
test('electronic invoicing presentation centralizes configuration and ready states', () => {
  const b = browser();
  const missing = b.context.getElectronicInvoicingAlertPresentation({ enabled: false, missingFields: ['SIRET', 'Adresse', 'Email'] }, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(missing)), { label: 'Facturation électronique à préparer', detail: 'À compléter : SIRET · Adresse…', buttonLabel: 'Préparer', route: 'company', isReady: false });
  const ready = b.context.getElectronicInvoicingAlertPresentation({ enabled: true, identityComplete: true, providerName: 'Plateforme A' }, 2);
  assert.equal(ready.label, '2 factures prêtes à transmettre');
  assert.equal(ready.route, 'ready-documents');
  assert.equal(ready.isReady, true);
});
test('performance chart groups paid revenue and destroys previous instances', () => {
  const b = browser(); b.context.updateCommercialInsights([], [{ totalTTC: 120, paidAt: '2026-09-10' }, { totalTTC: 60, paidAt: '2026-08-10' }]);
  assert.equal(b.charts.length, 1); assert.deepEqual(Array.from(b.charts[0].options.data.datasets[0].data), [0, 0, 0, 0, 60, 120]);
  assert.equal(b.node('dashboardRevenueComparison').textContent, '+100 % vs le mois précédent');
  b.node('dashboardPeriod').value = 'year'; b.context.refreshDashboardPerformance();
  assert.equal(b.charts[0].destroyed, true); assert.equal(b.charts[1].options.data.labels.length, 12);
});
test('revenue chart series keep only values from the selected period buckets', () => {
  const b = browser();
  const today = new b.context.Date('2026-09-15T12:00:00Z');
  const series = b.context.getRevenueChartSeries([
    { totalTTC: 40, paidAt: '2026-09-15T09:00:00Z' },
    { totalTTC: 20, paidAt: '2026-09-10T09:00:00Z' },
    { totalTTC: 999, paidAt: '2026-08-01T09:00:00Z' }
  ], 'week', today);
  assert.equal(series.labels.length, 7);
  assert.deepEqual(Array.from(series.points), [0, 20, 0, 0, 0, 0, 40]);
});
test('analytics chart options centralize favorite contact data', () => {
  const b = browser();
  const options = b.context.getAnalyticsChartOptions([{ favorite: true }, { favorite: false }, { favorite: true }]);
  assert.deepEqual(JSON.parse(JSON.stringify(options)), {
    type: 'doughnut', data: { labels: ['Favoris', 'Autres'], datasets: [{ data: [2, 1] }] }
  });
});
test('contact creation chart options centralize date labels and counts', () => {
  const b = browser();
  const dateLabel = new b.context.Date('2026-09-10').toLocaleDateString();
  const options = b.context.getContactCreationChartOptions([{ createdAt: '2026-09-10' }, { createdAt: '2026-09-10' }, {}]);
  assert.deepEqual(JSON.parse(JSON.stringify(options)), {
    type: 'line', data: { labels: [dateLabel, 'Unknown'], datasets: [{ label: 'Nouveaux contacts', data: [2, 1], fill: true }] }
  });
});
test('commercial insight helpers distinguish a first payment from a revenue decrease', () => {
  const b = browser();
  const now = new b.context.Date('2026-09-15T12:00:00Z');
  const insight = b.context.getMonthlyRevenueInsight([
    { totalTTC: 70, paidAt: '2026-09-10T09:00:00Z' },
    { totalTTC: 100, paidAt: '2026-08-10T09:00:00Z' }
  ], now);
  assert.equal(insight.monthlyRevenue, 70);
  assert.equal(insight.invoiceCount, 1);
  assert.equal(insight.previousRevenue, 100);
  assert.equal(b.context.getRevenueComparison(insight.monthlyRevenue, insight.previousRevenue).text, '-30 % vs le mois précédent');
  assert.match(b.context.getRevenueComparison(70, 0).text, /Premier encaissement/);
});
test('best seller presentation centralizes ranks and quantity labels', () => {
  const b = browser();
  const items = b.context.getBestSellerPresentations([
    { type: 'order', products: [{ productName: 'Clavier', quantity: 3 }, { productName: 'Souris', quantity: 1 }] },
    { type: 'order', products: [{ productName: 'Clavier', quantity: 2 }] }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(items)), [
    { rank: 1, name: 'Clavier', quantityLabel: '5 unités' },
    { rank: 2, name: 'Souris', quantityLabel: '1 unité' }
  ]);
});
test('onboarding hides completed setup and tolerates API failure', async () => {
  const b = browser(); const responses = { '/api/company': { companyName: 'A', siret: 'B', email: 'C', address: 'D', city: 'E' }, '/api/contacts': [{}], '/api/products': [{}], '/api/invoices': [{ type: 'quote' }] };
  b.context.apiFetch = async url => responses[url]; await b.context.loadOnboardingChecklist();
  assert.equal(b.node('onboardingProgress').textContent, '4/4'); assert.equal(b.node('onboardingChecklist').hidden, true);
  responses['/api/products'] = []; await b.context.loadOnboardingChecklist();
  assert.equal(b.node('onboardingProgress').textContent, '3/4'); assert.equal(b.node('onboardingChecklist').hidden, false);
  b.context.apiFetch = async () => { throw new Error('offline'); }; await b.context.loadOnboardingChecklist();
  assert.equal(b.node('onboardingChecklist').hidden, true);
});
test('onboarding presentation centralizes completion and step numbering', () => {
  const b = browser();
  const presentation = b.context.getOnboardingPresentation(
    { companyName: 'A', siret: 'B', email: 'C', address: 'D', city: 'E' }, [{}], [], [{ type: 'quote' }]
  );
  assert.equal(presentation.completed, 3);
  assert.equal(presentation.progressLabel, '3/4');
  assert.deepEqual(JSON.parse(JSON.stringify(presentation.steps.map(step => ({ section: step.section, done: step.done, stepNumber: step.stepNumber })))), [
    { section: 'company', done: true, stepNumber: 1 }, { section: 'contacts', done: true, stepNumber: 2 },
    { section: 'products', done: false, stepNumber: 3 }, { section: 'quotesSection', done: true, stepNumber: 4 }
  ]);
});
