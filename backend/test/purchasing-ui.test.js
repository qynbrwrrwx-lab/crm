const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../../frontend'),html=fs.readFileSync(path.join(frontend,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
const modules=scripts.filter(s=>/^\/js\/(expenses|suppliers)(\.js|\/)/.test(s));
function browser(){
 const elements=new Map(),calls=[],toasts=[],navigation=[];let printed='';
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,focus(){},scrollIntoView(){},reset(){},remove(){elements.delete(id);}});
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-09-15T12:00:00Z']));}}
 const context=vm.createContext({Date:FixedDate,document:{getElementById:id=>elements.get(id)||null},console:{error(){}},
  apiFetch:async(...args)=>{calls.push(args);return {};},showToast:m=>toasts.push(m),confirmAppAction:async()=>true,
  showSection:s=>navigation.push(s),updateExpenseDashboard(){},renderTreasury(){},allProducts:[],
  open:()=>({document:{write:s=>{printed=s;},close(){}}})});context.window=context;
 for(const s of ['/js/core/text.js','/js/core/formatters.js',...modules])vm.runInContext(fs.readFileSync(path.join(frontend,s),'utf8'),context,{filename:s});
 return {context,calls,toasts,navigation,node:id=>elements.get(id),read:s=>vm.runInContext(s,context),printed:()=>printed,set:(name,value)=>{context.fixture=value;vm.runInContext(`${name}=fixture`,context);}};
}
const expense=(overrides={})=>({_id:'e',supplier:'Acme',label:'Achat',category:'Autres',amountTTC:40,status:'pending',dueDate:'2026-09-01',...overrides});
const supplier={_id:'s',name:'Acme',email:'contact@example.test'};
test('purchasing scripts load once with all extracted modules and no network activity',()=>{
 const b=browser();assert.equal(modules.length,15);assert.equal(new Set(modules).size,15);assert.equal(b.calls.length,0);
 for(const domain of ['expenses','suppliers']){
  const entries=modules.filter(s=>s.startsWith(`/js/${domain}/`));
  assert.deepEqual(entries.map(s=>path.basename(s)).sort(),fs.readdirSync(path.join(frontend,`js/${domain}`)).filter(s=>s.endsWith('.js')).sort());
  for(const s of entries)assert.ok(scripts.indexOf(s)>scripts.indexOf(`/js/${domain}.js`));
 }
});
test('expense filters combine text, category and overdue state while keeping global totals',()=>{
 const b=browser();b.set('allExpenses',[expense({label:'<achat>'}),expense({_id:'paid',status:'paid',amountTTC:60}),expense({_id:'future',dueDate:'2026-12-01'})]);
 b.node('expensesFilter').value='acme';b.node('expensesStatusFilter').value='overdue';b.node('expensesCategoryFilter').value='Autres';b.context.renderExpenses();
 assert.equal((b.node('expensesList').innerHTML.match(/<article/g)||[]).length,1);assert.match(b.node('expensesList').innerHTML,/&lt;achat&gt;/);
 assert.equal(b.node('expensesPendingTotal').textContent,b.context.formatCurrency(80));assert.equal(b.node('expensesPaidTotal').textContent,b.context.formatCurrency(60));
});
test('expense row presentation centralizes status, due date and payment action',()=>{
 const b=browser(),pending=expense({recurrence:'monthly'});assert.equal(JSON.stringify(b.context.getExpenseListRowPresentation(pending)),JSON.stringify({id:'e',className:'expense-item is-pending',contextLabel:'Autres · Acme · Mensuelle',label:'Achat',dateLabel:`À régler le ${b.context.formatExpenseDate('2026-09-01')}`,amountLabel:b.context.formatExpenseCurrency(40),statusLabel:'À payer',statusClass:'pending',canMarkPaid:true}));const paid=b.context.getExpenseListRowPresentation(expense({status:'paid',paidAt:'2026-09-02'}));assert.equal(paid.dateLabel,`Réglée le ${b.context.formatExpenseDate('2026-09-02')}`);assert.equal(paid.canMarkPaid,false);
});
test('expense selection keeps totals global while returning only matching rows',()=>{
 const b=browser();const expenses=[expense({_id:'late',label:'Hébergement',amountTTC:80}),expense({_id:'paid',status:'paid',amountTTC:60}),expense({_id:'future',dueDate:'2026-12-01'})];
 const selected=b.context.selectExpenses(expenses,{query:'hébergement',status:'overdue',category:'Autres'});
 assert.deepEqual(JSON.parse(JSON.stringify(selected.visibleExpenses.map(item=>item._id))),['late']);assert.equal(selected.pendingTotal,120);assert.equal(selected.paidTotal,60);assert.deepEqual(expenses.map(item=>item._id),['late','paid','future']);
});
test('monthly expense requires a due date and invalid amounts make no request',async()=>{
 const b=browser();b.node('expenseSupplier').value='Acme';b.node('expenseLabel').value='Abonnement';b.node('expenseAmount').value='10';b.node('expenseRecurrence').value='monthly';await b.context.saveExpense();
 assert.equal(b.calls.length,0);assert.match(b.toasts[0],/échéance/);
 b.node('expenseDueDate').value='2026-09-20';b.node('expenseAmount').value='-1';await b.context.saveExpense();assert.equal(b.calls.length,0);
});
test('editing an expense preserves recurrence and sends the existing PUT contract',async()=>{
 const b=browser();b.set('allExpenses',[expense({recurrence:'monthly'})]);await b.context.editExpense('e');b.context.loadExpenses=async()=>{};
 await b.context.saveExpense();assert.equal(b.calls[0][0],'/api/expenses/e');assert.equal(b.calls[0][1].method,'PUT');
 assert.deepEqual(JSON.parse(b.calls[0][1].body),{supplier:'Acme',label:'Achat',category:'Autres',recurrence:'monthly',amountTTC:40,dueDate:'2026-09-01'});assert.equal(b.read('editingExpenseId'),null);
});
test('payment reports recurring follow-up and cancelled payment or deletion makes no request',async()=>{
 const b=browser();b.context.loadExpenses=async()=>{};b.context.apiFetch=async(...args)=>{b.calls.push(args);return {nextExpense:{}};};await b.context.markExpensePaid('e');
 assert.equal(b.calls[0][0],'/api/expenses/e/pay');assert.equal(b.calls[0][1].method,'PUT');assert.match(b.toasts[0],/prochaine échéance créée/);
 b.context.confirmAppAction=async()=>false;await b.context.markExpensePaid('e');await b.context.deleteExpense('e');await b.context.deleteSupplier('s');await b.context.deleteExpenseBudget('Autres');assert.equal(b.calls.length,1);
});
test('monthly budget counts only settled current-month expenses and marks overspending',()=>{
 const b=browser();b.set('allExpenses',[expense({status:'paid',amountTTC:120,paidAt:'2026-09-05'}),expense({status:'paid',amountTTC:500,paidAt:'2026-08-05'}),expense({amountTTC:999})]);b.set('allExpenseBudgets',[{category:'Autres',monthlyAmount:100}]);
 assert.equal(b.context.currentMonthPaidByCategory('Autres'),120);b.context.renderExpenseBudgets();assert.match(b.node('expenseBudgetsList').innerHTML,/expense-budget-row over/);assert.match(b.node('expenseBudgetsList').innerHTML,/width:100%/);assert.match(b.node('expenseBudgetsList').innerHTML,/120 %/);
});
test('budget summary separates spending, progress and status from its rendered row',()=>{
 const b=browser();b.set('allExpenses',[expense({status:'paid',amountTTC:85,paidAt:'2026-09-05'})]);
 const summary=b.context.getExpenseBudgetSummary({category:'Autres',monthlyAmount:100});
 assert.deepEqual(JSON.parse(JSON.stringify(summary)),{category:'Autres',monthlyAmount:100,spent:85,amount:100,percent:85,progress:85,status:'warning'});
 assert.match(b.context.renderExpenseBudgetRow({category:'Autres',monthlyAmount:100}),/expense-budget-row warning/);
});
test('budget saving encodes category and preserves zero amount',async()=>{
 const b=browser();b.node('expenseBudgetCategory').value='Frais / divers';b.node('expenseBudgetAmount').value='0';b.context.loadExpenseBudgets=async()=>{};await b.context.saveExpenseBudget({preventDefault(){}});
 assert.equal(b.calls[0][0],'/api/expense-budgets/Frais%20%2F%20divers');assert.deepEqual(JSON.parse(b.calls[0][1].body),{monthlyAmount:0});
});
test('supplier cards link products and expenses case-insensitively and escape notes',()=>{
 const b=browser();b.set('allSuppliers',[{...supplier,notes:'<note>'}]);b.set('allExpenses',[expense({supplier:'ACME'})]);b.context.allProducts=[{supplierName:'acme',stock:0,lowStockThreshold:0}];b.context.renderSuppliers();
 const body=b.node('suppliersList').innerHTML;assert.match(body,/1 produit · 1 dépense/);assert.match(body,/1 produit à réassortir/);assert.match(body,/&lt;note&gt;/);
 b.context.syncSupplierSuggestions();assert.match(b.node('expenseSupplierSuggestions').innerHTML,/Acme/);
 b.context.startExpenseForSupplier('s');assert.deepEqual(b.navigation,['expensesSection']);assert.equal(b.node('expenseSupplier').value,'Acme');
});
test('supplier helpers select matching suppliers and summarize related purchases',()=>{
 const b=browser(),suppliers=[supplier,{_id:'other',name:'Beta',notes:'Matériel'}],products=[{supplierName:'ACME',stock:0,lowStockThreshold:0},{supplierName:'acme',stock:8,lowStockThreshold:5}],expenses=[expense({supplier:'Acme'}),expense({supplier:'Other'})];
 assert.deepEqual(JSON.parse(JSON.stringify(b.context.selectSuppliers(suppliers,'matériel').map(item=>item._id))),['other']);
 const usage=b.context.getSupplierUsage(suppliers[0],products,expenses);assert.equal(usage.products.length,2);assert.equal(usage.urgentProducts.length,1);assert.equal(usage.expenses.length,1);assert.equal(products[0].supplierName,'ACME');
});
test('supplier card presentation centralizes usage labels and available actions',()=>{
 const b=browser(),products=[{supplierName:'ACME',stock:0,lowStockThreshold:0},{supplierName:'acme',stock:8,lowStockThreshold:5}],expenses=[expense({supplier:'Acme'})];assert.equal(JSON.stringify(b.context.getSupplierCardPresentation(supplier,products,expenses)),JSON.stringify({id:'s',initial:'A',name:'Acme',contactName:'Interlocuteur non renseigné',productLabel:'2 produits',expenseLabel:'1 dépense',restockLabel:'1 produit à réassortir',lastRestockLabel:'',notes:'',email:'contact@example.test',phone:'',canCreatePurchaseOrder:true,canRequestRestock:true}));assert.equal(b.context.getSupplierCardPresentation({...supplier,email:''},products,expenses).canRequestRestock,false);
});
test('supplier editing saves trimmed contact fields through PUT',async()=>{
 const b=browser();b.set('allSuppliers',[supplier]);b.context.editSupplier('s');b.node('supplierName').value=' Acme ';b.context.loadSuppliers=async()=>{};await b.context.saveSupplier({preventDefault(){}});
 assert.equal(b.calls[0][0],'/api/suppliers/s');assert.equal(b.calls[0][1].method,'PUT');assert.equal(JSON.parse(b.calls[0][1].body).name,'Acme');assert.equal(b.read('editingSupplierId'),null);
});
test('purchase order creation selects supplier shortages and keeps zero threshold restock minimum',async()=>{
 const b=browser();b.set('allSuppliers',[supplier]);b.context.allProducts=[{_id:'p',supplierName:'ACME',name:'Article',stock:0,lowStockThreshold:0},{_id:'healthy',supplierName:'Acme',stock:10,lowStockThreshold:5},{_id:'other',supplierName:'Other',stock:0}];b.context.loadSuppliers=async()=>{};
 await b.context.createPurchaseOrderForSupplier('s');assert.equal(b.calls[0][0],'/api/purchase-orders');assert.equal(b.calls[0][1].method,'POST');assert.deepEqual(JSON.parse(b.calls[0][1].body),{supplierId:'s',lines:[{productId:'p',name:'Article',reference:'',quantity:1}]});
});
test('purchase order helpers retain status labels, pending count and draft actions',()=>{
 const b=browser(),orders=[{_id:'draft',number:'BC-1',supplierId:{name:'Acme'},lines:[{}],status:'draft'},{_id:'sent',number:'BC-2',supplierId:{name:'Beta'},lines:[{},{}],status:'sent',sentAt:'2026-09-01'}];
 assert.equal(b.context.getPendingPurchaseOrderCount(orders),1);const markup=b.context.renderPurchaseOrderList(orders);assert.match(markup,/Envoyer/);assert.match(markup,/selected>Envoyé/);assert.match(b.context.renderPurchaseOrderList([]),/Aucun bon de commande/);
});
test('purchase order presentation centralizes supplier, line count and send action',()=>{
 const b=browser(),draft={_id:'draft',number:'BC-1',supplierId:{name:'Acme'},lines:[{}],status:'draft'};assert.equal(JSON.stringify(b.context.getPurchaseOrderPresentation(draft)),JSON.stringify({id:'draft',number:'BC-1',supplierName:'Acme',lineCount:1,dateLabel:'',canSend:true}));const sent=b.context.getPurchaseOrderPresentation({_id:'sent',number:'BC-2',lines:[],status:'sent'});assert.equal(sent.supplierName,'Fournisseur');assert.equal(sent.canSend,false);
});
test('receiving a purchase order requires confirmation and refreshes stock only after successful update',async()=>{
 const b=browser();let stocks=0;b.context.loadSuppliers=async()=>{};b.context.loadProducts=async()=>stocks++;b.context.confirmAppAction=async()=>false;await b.context.updatePurchaseOrderStatus('o','received');assert.equal(b.calls.length,0);assert.equal(stocks,0);
 b.context.confirmAppAction=async()=>true;await b.context.updatePurchaseOrderStatus('o','received');assert.equal(b.calls[0][0],'/api/purchase-orders/o/status');assert.deepEqual(JSON.parse(b.calls[0][1].body),{status:'received'});assert.equal(stocks,1);
 b.context.apiFetch=async()=>{throw new Error('offline');};await b.context.updatePurchaseOrderStatus('o','received');assert.equal(stocks,1);assert.equal(b.toasts.at(-1),'offline');
});
test('cancelled restock email makes no request',async()=>{
 const b=browser();b.set('allSuppliers',[supplier]);b.context.confirmAppAction=async()=>false;await b.context.sendRestockRequest('s');assert.equal(b.calls.length,0);
});
test('purchase order print escapes supplier and document names as well as lines',()=>{
 const b=browser();b.context.purchaseOrders=[{_id:'o',number:'<numero>',supplierId:{name:'<fournisseur>'},lines:[{name:'<article>',reference:'<ref>',quantity:2}]}];b.context.printPurchaseOrder('o');
 const output=b.printed();for(const name of ['numero','fournisseur','article','ref']){assert.ok(output.includes(`&lt;${name}&gt;`));assert.ok(!output.includes(`<${name}>`));}
});
